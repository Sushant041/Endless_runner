module endless_runner::runner_nft {
    use one::object::{Self, UID, ID};
    use one::tx_context::{Self, TxContext};
    use one::transfer;
    use one::event;
    use one::url::{Self, Url};
    use one::table::{Self, Table};
    use std::string::{Self, String};

    // ERROR CODES
    const E_INVALID_SKIN_ID: u64 = 1;
    const E_INSUFFICIENT_SCORE: u64 = 2;

    // SKIN IDS & SCORES
    const SKIN_BLUE: u8 = 0;   const SCORE_BLUE: u64 = 0;
    const SKIN_RED: u8 = 1;    const SCORE_RED: u64 = 100;
    const SKIN_GREEN: u8 = 2;  const SCORE_GREEN: u64 = 500;
    const SKIN_YELLOW: u8 = 3; const SCORE_YELLOW: u64 = 1000;
    const SKIN_PURPLE: u8 = 4; const SCORE_PURPLE: u64 = 2500;
    const SKIN_ORANGE: u8 = 5; const SCORE_ORANGE: u64 = 5000;

    // ADMIN CAP
    public struct AdminCap has key { id: UID }

    // NFT STRUCT
    public struct RunnerSkinNFT has key, store {
        id: UID,
        skin_id: u8,
        name: String,
        image_url: Url,
        unlocked_at_score: u64,
        minted_at: u64,
    }

    // SCORE REGISTRY
    public struct ScoreRegistry has key {
        id: UID,
        scores: Table<address, u64>,
    }

    // EVENTS
    public struct NFTMinted has copy, drop { recipient: address, skin_id: u8, nft_id: ID }
    public struct ScoreUpdated has copy, drop { player: address, new_score: u64 }
    public struct NFTUnlocked has copy, drop { player: address, skin_id: u8, score: u64 }

    // INIT
    fun init(ctx: &mut TxContext) {
        let admin = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin, tx_context::sender(ctx));

        let registry = ScoreRegistry {
            id: object::new(ctx),
            scores: table::new(ctx),
        };

        transfer::share_object(registry);
    }

    // --- HELPERS & ACCESSORS ---

    public fun get_required_score(skin_id: u8): u64 {
        if (skin_id == SKIN_BLUE) SCORE_BLUE
        else if (skin_id == SKIN_RED) SCORE_RED
        else if (skin_id == SKIN_GREEN) SCORE_GREEN
        else if (skin_id == SKIN_YELLOW) SCORE_YELLOW
        else if (skin_id == SKIN_PURPLE) SCORE_PURPLE
        else SCORE_ORANGE
    }

    public fun get_skin_name(skin_id: u8): String {
        if (skin_id == SKIN_BLUE) string::utf8(b"Blue Runner")
        else if (skin_id == SKIN_RED) string::utf8(b"Red Runner")
        else if (skin_id == SKIN_GREEN) string::utf8(b"Green Runner")
        else if (skin_id == SKIN_YELLOW) string::utf8(b"Yellow Runner")
        else if (skin_id == SKIN_PURPLE) string::utf8(b"Purple Runner")
        else string::utf8(b"Orange Runner")
    }

    public fun get_player_score(registry: &ScoreRegistry, player: address): u64 {
        if (table::contains(&registry.scores, player)) {
            *table::borrow(&registry.scores, player)
        } else { 0 }
    }

    // ✅ ADDED MISSING ACCESSORS FOR TESTS
    public fun nft_skin_id(nft: &RunnerSkinNFT): u8 { nft.skin_id }
    public fun nft_score(nft: &RunnerSkinNFT): u64 { nft.unlocked_at_score }

    // --- ENTRY FUNCTIONS ---

    public entry fun update_score(
        registry: &mut ScoreRegistry,
        new_score: u64,
        ctx: &TxContext
    ) {
        let player = tx_context::sender(ctx);
        let exists = table::contains(&registry.scores, player);
        let current = if (exists) { *table::borrow(&registry.scores, player) } else { 0 };

        if (new_score > current) {
            if (exists) {
                *table::borrow_mut(&mut registry.scores, player) = new_score;
            } else {
                table::add(&mut registry.scores, player, new_score);
            };
            event::emit(ScoreUpdated { player, new_score });
        }
    }

    public entry fun mint_skin_nft(
        registry: &mut ScoreRegistry,
        skin_id: u8,
        image_url: vector<u8>, 
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);

        assert!(skin_id <= SKIN_ORANGE, E_INVALID_SKIN_ID);
        let score = get_player_score(registry, player);
        let required = get_required_score(skin_id);
        assert!(score >= required, E_INSUFFICIENT_SCORE);

        let nft = RunnerSkinNFT {
            id: object::new(ctx),
            skin_id,
            name: get_skin_name(skin_id),
            image_url: url::new_unsafe_from_bytes(image_url),
            unlocked_at_score: score,
            minted_at: tx_context::epoch_timestamp_ms(ctx),
        };

        let nft_id = object::id(&nft);
        transfer::public_transfer(nft, player);

        event::emit(NFTMinted { recipient: player, skin_id, nft_id });
        event::emit(NFTUnlocked { player, skin_id, score });
    }

    public entry fun transfer_nft(
        nft: RunnerSkinNFT,
        recipient: address,
        _ctx: &TxContext
    ) {
        transfer::public_transfer(nft, recipient);
    }

    // --- UNIT TESTS ---

    #[test]
    fun test_nft_create() {
        let mut ctx = tx_context::dummy();

        let nft = RunnerSkinNFT {
            id: object::new(&mut ctx),
            skin_id: 2, 
            name: string::utf8(b"Green Runner"),
            image_url: url::new_unsafe_from_bytes(b"http://test.png"),
            unlocked_at_score: 550,
            minted_at: 100,
        };

        // These calls will now work because the functions exist above
        assert!(nft_skin_id(&nft) == 2, 0);
        assert!(nft_score(&nft) == 550, 1);

        let RunnerSkinNFT { id, skin_id: _, name: _, image_url: _, unlocked_at_score: _, minted_at: _ } = nft;
        object::delete(id);
    }

    #[test]
    fun test_score_update_logic() {
        let mut ctx = tx_context::dummy();
        
        let mut registry = ScoreRegistry {
            id: object::new(&mut ctx),
            scores: table::new(&mut ctx),
        };

        let player = tx_context::sender(&ctx);

        table::add(&mut registry.scores, player, 100);
        assert!(get_player_score(&registry, player) == 100, 0);

        let current = table::borrow_mut(&mut registry.scores, player);
        *current = 200;
        assert!(get_player_score(&registry, player) == 200, 1);

        let ScoreRegistry { id, scores } = registry;
        table::drop(scores);
        object::delete(id);
    }

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx)
    }
}