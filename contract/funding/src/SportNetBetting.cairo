use starknet::ContractAddress;

#[starknet::interface]
pub trait ISportNetBetting<TContractState> {
    fn createMarket(
        ref self: TContractState,
        name: ByteArray,
        description: ByteArray,
        athlete: ContractAddress,
        minBet: u256,
    );
    fn betOnMarket(ref self: TContractState, marketId: u128, outcome: u8, amount: u256);
    fn resolveMarket(ref self: TContractState, marketId: u128, winningOption: u8);
    fn claimWinnings(ref self: TContractState, marketId: u128, receiver: ContractAddress);
    fn getWinnerShares(ref self: TContractState, marketId: u128) -> (u256, u256);
    fn checkMarketStatus(ref self: TContractState, marketId: u128, user: ContractAddress);
    fn addWinningSponsors(ref self: TContractState, marketId: u128, sponsor_shares: u256);
    fn getMarketCount(self: @TContractState) -> u128;
    fn getMarket(self: @TContractState, marketId: u128) -> SportNetBetting::Market;
    fn getContractOwner(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod SportNetBetting {
    use funding::SportNetFunding::ISportNetCrowdFundingDispatcherTrait;
    use funding::SportNetBetting::ISportNetBetting;
    use funding::SportNetFunding::ISportNetCrowdFundingDispatcher;
    use core::clone::Clone;
    use core::traits::AddEq;
    use core::option::OptionTrait;
    use core::array::ArrayTrait;
    use core::traits::Into;
    use core::num::traits::zero::Zero;
    use core::starknet::event::EventEmitter;
    use starknet::{ContractAddress, get_caller_address, get_contract_address, SyscallResultTrait, storage_access::StorageBaseAddress};
    use starknet::syscalls::{call_contract_syscall};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        // ERC20 token address
        token_address: ContractAddress,

        // funding contract address
        crowfundingContract: ContractAddress,

        // market count
        market_count: u128,

        // market ID and market details pair
        markets: LegacyMap::<u128, Market>,

        // market participants
        market_participants: LegacyMap::<(u128, ContractAddress), Participants>,

        // market winners
        market_winners: LegacyMap::<(u128, ContractAddress), Winners>,

        // participant and bool pair
        participant_exists: LegacyMap::<(u128, ContractAddress), bool>,

        // winner and bool pair
        winner_exists: LegacyMap::<(u128, ContractAddress), bool>,

        // beter count
        beter_count: u128,

        // user ID and user address pair
        beters: LegacyMap::<u128, ContractAddress>,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Market {
        name: ByteArray,
        description: ByteArray,
        pub athlete: ContractAddress,
        pub outcomes: (Scenarios, Scenarios),
        isSettled: bool,
        isActive: bool,
        isVerified: bool,
        winningOutcome: Option<Scenarios>,
        pub minBet: u256,
        pub moneyInPool: u256,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Participants {
        pub user: ContractAddress,
        pub chosenOutcome: Scenarios,
        betAmount: u256,
    }

    #[derive(Drop, Serde, Clone, starknet::Store, PartialEq, Eq)]
    pub struct Winners {
        pub user: ContractAddress,
        pub wins: u256,
        pub claimed: bool,
    }

    #[derive(Drop, Serde, Copy, starknet::Store, PartialEq, Eq)]
    pub struct Scenarios {
        name: felt252,
        opted: u128,
        amount: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreatedMarket: CreatedMarket,
        BetPlaced: BetPlaced,
        MarketResolved: MarketResolved,
    }
    #[derive(Drop, starknet::Event)]
    struct CreatedMarket {
        #[key]
        market_id: u128,
        market: Market,
        athlete: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct BetPlaced {
        #[key]
        user_id: u128,
        user: ContractAddress,
        market_id: u128,
        athlete: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct MarketResolved {
        #[key]
        market_id: u128,
        winningOutcome: Option<Scenarios>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, crowdfunding: ContractAddress, token: ContractAddress) {
        self.owner.write(owner);
        self.market_count.write(0);
        self.beter_count.write(0);
        self.crowfundingContract.write(crowdfunding);
        self.token_address.write(token);
    }

    #[abi(embed_v0)]
    impl SportNetBetting of super::ISportNetBetting<ContractState> {

        fn createMarket(
            ref self: ContractState,
            name: ByteArray,
            description: ByteArray,
            athlete: ContractAddress,
            minBet: u256,
        ) {
            let user: ContractAddress = get_caller_address();
            assert!(user == self.getContractOwner(), "Only owner can create a market");
            let mut token1 = Scenarios { name: 'Win', opted: 0_u128, amount: 0_u256};
            let mut token2 = Scenarios { name: 'Loss', opted: 0_u128, amount: 0_u256};

            let tokens = (token1, token2);

            // Check if the creator is a registered athlete
            assert!(ISportNetCrowdFundingDispatcher{contract_address: self.crowfundingContract.read()}.is_athlete_register(athlete), "Athlete is not registered yet!");
            let market = Market {
                name,
                description,
                athlete,
                outcomes: tokens,
                isSettled: false,
                isActive: true,
                isVerified: true,
                winningOutcome: Option::None,
                minBet,
                moneyInPool: 0,
            };

            let market_id = self.getMarketCount() + 1;

            self.market_count.write(market_id);
            self.markets.write(market_id, market);
            let createdMarket = self.getMarket(market_id);
            self.emit(CreatedMarket {market_id, market: createdMarket, athlete, amount: 0_u256});
        }

        fn betOnMarket(ref self: ContractState, marketId: u128, outcome: u8, amount: u256) {
            let beter: ContractAddress = get_caller_address();
            let mut market = self.getMarket(marketId);
            assert!(market.clone().isVerified, "Market does not exist");
            assert!(market.clone().isActive, "Market has already been resolved");
            assert!(amount >= market.clone().minBet, "Market accept a larger minimum bet amount");

            let beterId = self.beter_count.read() + 1;
            self.beter_count.write(beterId);
            self.beters.write(beterId, beter);
            let (mut opt1, mut opt2) = market.clone().outcomes;

            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, amount);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(beter,contract_address, amount);

            assert!(result, "Transfer Failed!");
            if outcome == 0 {
                let user_part = Participants {
                    user: beter,
                    chosenOutcome: opt1,
                    betAmount: amount,
                };
                opt1.opted = opt1.opted + 1;
                opt1.amount = opt1.amount + amount;
                self.market_participants.write((marketId, beter), user_part.clone());
                self.participant_exists.write((marketId, beter), true);
            } else {
                let user_part = Participants {
                    user: beter,
                    chosenOutcome: opt2,
                    betAmount: amount,
                };
                opt2.opted = opt2.opted + 1;
                opt2.amount = opt2.amount + amount;
                self.market_participants.write((marketId, beter), user_part.clone());
                self.participant_exists.write((marketId, beter), true);
            }
            market.moneyInPool = market.clone().moneyInPool + amount;
            self.markets.write(marketId, market.clone());
            self.emit(BetPlaced {user_id: beterId, user: beter, market_id: marketId, athlete: market.athlete, amount});
        }

        fn resolveMarket(ref self: ContractState, marketId: u128, winningOption: u8) {
            assert!(get_caller_address() == self.getContractOwner(), "Only the owner can setlle markets");
            assert!(winningOption == 0_u8 || winningOption == 1_u8, "Invalid option provided");
            let mut currentMarket = self.getMarket(marketId);
            assert!(currentMarket.clone().isActive == true, " Only active markets can be resolved");
            currentMarket.isActive = false;
            currentMarket.isSettled = true;
            let (marketOption1, marketOption2) = currentMarket.clone().outcomes;
            if winningOption == 0 {
                currentMarket.winningOutcome = Option::Some(marketOption1);
            } else {
                currentMarket.winningOutcome = Option::Some(marketOption2);
            }
            self.markets.write(marketId, currentMarket.clone());
            self.emit(MarketResolved {market_id: marketId, winningOutcome: currentMarket.winningOutcome});
        }

        fn claimWinnings(ref self: ContractState, marketId: u128, receiver: ContractAddress) {
            assert!(!receiver.is_zero(), "Receiver cannot be address zero");
            let user = get_caller_address();
            self.checkMarketStatus(marketId, user);
            assert!(self.winner_exists.read((marketId, user)), "User is not one of the winners in the market");
            let user_wins = self.market_winners.read((marketId, user));
            assert!(!user_wins.claimed, "User has already claimed their winning funds");
            assert!(user_wins.wins > 0, "User wins are 0");
            let token_address: ContractAddress = self.token_address.read();
            let contract_address = get_contract_address();
            let winner = Winners {
                user,
                wins: user_wins.wins,
                claimed: true,
            };
            self.market_winners.write((marketId, user), winner);
            self.winner_exists.write((marketId, user), true);
            IERC20Dispatcher{contract_address: token_address}.approve(contract_address, user_wins.wins);
            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, receiver, user_wins.wins);
            assert!(result, "Transfer Failed!");
        }

        fn getWinnerShares(ref self: ContractState, marketId: u128) -> (u256, u256) {
            let market = self.getMarket(marketId);
            let winningOption = market.clone().winningOutcome.unwrap();
            let (opt1, opt2) = market.clone().outcomes;
            let mut sponsor_shares: u256 = 0;
            let mut winner_shares: u256 = 0;
            if opt1 == winningOption {
                let profit_pot = opt2.amount;
                winner_shares = (profit_pot * (65/100))/(opt1.opted.into());
                sponsor_shares = (profit_pot - (winner_shares * opt1.opted.into()));
            } else {
                let profit_pot = opt1.amount;
                winner_shares = (profit_pot * (65/100))/(opt2.opted.into());
                sponsor_shares = (profit_pot - (winner_shares * opt2.opted.into()));
            }
            return (sponsor_shares, winner_shares);
        }

        fn checkMarketStatus(ref self: ContractState, marketId: u128, user: ContractAddress) {
            let market = self.getMarket(marketId);
            assert!(market.isSettled, "Market has not been resolved yet!");
            assert!(self.participant_exists.read((marketId, user)), "User is not part of the market");

            let market_user = self.market_participants.read((marketId,user));
            let (sponsor_share, winner_shares) = self.getWinnerShares(marketId);
            if market_user.chosenOutcome == market.winningOutcome.unwrap() {
                let winner = Winners {
                    user,
                    wins: market_user.betAmount + winner_shares,
                    claimed: false,
                };
                self.market_winners.write((marketId,user), winner);
                self.winner_exists.write((marketId, user), true);
            }
            self.addWinningSponsors(marketId, sponsor_share);
        }

        fn addWinningSponsors(ref self: ContractState, marketId: u128, sponsor_shares: u256) {
            let market = self.getMarket(marketId);
            let athlete = market.athlete;
            let funding_contract = self.crowfundingContract.read();
            let sponsors = ISportNetCrowdFundingDispatcher{contract_address: funding_contract}.get_sponsors_by_athlete(athlete);
            let mut index: u32 = 0;
            let (sponsor_shares, _winner_shares) = self.getWinnerShares(marketId);
            let platform_fee = sponsor_shares * (1/100);
            let sponsor_shares_after_fees = sponsor_shares - platform_fee;
            loop {
                if index == sponsors.len() {
                    break;
                }
                let sponsor_user = sponsors.at(index);
                let sponsor_contribution = ISportNetCrowdFundingDispatcher{contract_address: funding_contract}.sponsor_share(athlete,sponsor_user.clone());
                let sponsor_wins: u256 = sponsor_contribution.into() * sponsor_shares_after_fees;
                let sponsor_win = Winners {
                    user: sponsor_user.clone(),
                    wins: sponsor_wins,
                    claimed: false,
                };
                self.market_winners.write((marketId, sponsor_user.clone()), sponsor_win);
                self.winner_exists.write((marketId, sponsor_user.clone()), true);
                index.add_eq(1);
            };
            let owner = self.getContractOwner();
            let platform_fee_owner = Winners {
                user: owner,
                wins: platform_fee,
                claimed: false,
            };
            self.market_winners.write((marketId, owner), platform_fee_owner);
            self.winner_exists.write((marketId, owner), true);
        }

        fn getMarketCount(self: @ContractState) -> u128 {
            return self.market_count.read();
        }

        fn getMarket(self: @ContractState, marketId: u128) -> Market {
            assert!(marketId <= self.getMarketCount(), "Market does not exist");
            return self.markets.read(marketId);
        }

        fn getContractOwner(self: @ContractState) -> ContractAddress {
            return self.owner.read();
        }
    }
}

// #[cfg(test)]
// mod tests {
//     use super::{ SportNetBetting, ISportNetBettingDispatcher, ISportNetBettingDispatcherTrait };
//     use funding::SportNetFunding::{ SportNetCrowdFunding ,ISportNetCrowdFundingDispatcher, ISportNetCrowdFundingDispatcherTrait };
//     use starknet::{ ContractAddress, syscalls::deploy_syscall, contract_address_const, get_caller_address, get_contract_address };
//     use core::result::ResultTrait;
//     use starknet::class_hash::ClassHash;
//     use snforge_std::{declare, start_mock_call, test_address, start_cheat_caller_address, stop_cheat_caller_address, cheat_caller_address_global, ContractClassTrait };
//     // use starknet::class_hash::Felt252TryIntoClassHash;
//     // use option::OptionTrait;
//     // use traits::TryInto;

//     fn deploy_betting_contract() -> ContractAddress {
//         let betting_class_hash = declare("SportNetBetting").unwrap();
//         let mut calldata = array![];
//         let (contract_address, _) = betting_class_hash.deploy(@calldata).unwrap();
//         contract_address
//     }

//     fn deploy_funding_contract() -> ContractAddress {
//         let funding_class_hash = declare("SportNetCrowdFunding").unwrap();
//         let mut calldata = array![];
//         let (contract_address, _) = funding_class_hash.deploy(@calldata).unwrap();
//         contract_address
//     }

//     // #[test]
//     // #[available_gas(1000000)]
//     // fn test_get() {
//     //     let contract = deploy_contract();
//     //     let data = contract.get();

//     //     assert_eq!(0, data);
//     // }

//     // #[test]
//     // #[available_gas(1000000)]
//     // fn test_set() {
//     //     let contract = deploy_contract();
//     //     contract.set(10);
//     //     let data = contract.get();

//     //     assert_eq!(10, data);
//     // }
// }
