use starknet::ContractAddress;

#[starknet::interface]
pub trait ISportNetCrowdFunding<TContractState> {
    fn athlete_register(ref self: TContractState);
    fn create_campaign(ref self: TContractState, amount: u256);
    fn sponsor(ref self: TContractState, campaign_id: u128, amount: u256);
    fn claim(ref self: TContractState, campaign_id: u128);
    fn is_athlete_register(self: @TContractState, athlete: ContractAddress) -> bool;
    fn sponsor_share(self: @TContractState, athlete: ContractAddress, sponsor: ContractAddress) -> u128;
    fn get_sponsors_by_athlete(self: @TContractState, athlete: ContractAddress) -> Array<ContractAddress>;
}

#[starknet::contract]
pub mod SportNetCrowdFunding {
    use starknet::{get_caller_address, get_contract_address, ContractAddress, SyscallResultTrait};
    use starknet::syscalls::{call_contract_syscall};
    use core::array::ArrayTrait;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    
    #[storage]
    struct Storage {
        // contract owner address
        owner: ContractAddress,

        token_address: ContractAddress,

        // athlete and verified pair
        athletes: LegacyMap::<ContractAddress, bool>,

        // athlete and verified pair
        athlete_funded: LegacyMap::<ContractAddress, u256>,

        // (athlete,sponsor) tuple and athlete pair
        athlete_sponsors: LegacyMap::<(ContractAddress, ContractAddress), u256>,

        // (athlete,sponsor) tuple and bool pair
        athlete_sponsor_exists: LegacyMap::<(ContractAddress, ContractAddress), bool>,

        // campaign ID and amount pair
        campaigns: LegacyMap::<u128, u256>,

        // campaign ID and status pair
        campaign_status: LegacyMap::<u128, bool>,

        // campaign ID and athlete pair
        athlete_campaigns: LegacyMap::<u128, ContractAddress>,

        // campaign ID and collected amount pair
        campaign_amount: LegacyMap::<u128, u256>,

        // campaign count
        campaign_count: u128,

        // sponsor count
        sponsor_count: u128,

        // sponsor ID and sponsor pair
        sponsors: LegacyMap::<u128, ContractAddress>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Registered: Registered,
        CreatedCampaign: CreatedCampaign,
        Sponspored: Sponspored,
        Claimed: Claimed,
    }
    #[derive(Drop, starknet::Event)]
    struct Registered {
        #[key]
        athlete: ContractAddress,
    }
    #[derive(Drop, starknet::Event)]
    struct CreatedCampaign {
        #[key]
        campaign_id: u128,
        athlete: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Sponspored {
        #[key]
        sponsor: ContractAddress,
        campaign_id: u128,
        athlete: ContractAddress,
        amount: u256,
    }
    #[derive(Drop, starknet::Event)]
    struct Claimed {
        #[key]
        campaign_id: u128,
        athlete: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, token_address: ContractAddress) {
        self.owner.write(owner);
        self.campaign_count.write(0);
        self.token_address.write(token_address);
    }

    #[abi(embed_v0)]
    impl SportNetCrowdFunding of super::ISportNetCrowdFunding<ContractState> {
        fn athlete_register(ref self: ContractState) {
            let athlete: ContractAddress = get_caller_address();
            assert!(!self.athletes.read(athlete), "Athlete already registered!");
            self.athletes.write(athlete, true);
            self.athlete_funded.write(athlete, 0);

            self.emit(Registered {athlete});
        }

        fn create_campaign(ref self: ContractState, amount: u256) {
            let athlete: ContractAddress = get_caller_address();
            assert!(self.athletes.read(athlete), "Athlete is not registered!");
            assert!(amount > 0, "Campaign amount cannot be 0");

            let campaign_id = self.campaign_count.read();
            self.campaigns.write(campaign_id, amount);
            self.athlete_campaigns.write(campaign_id, athlete);
            self.campaign_amount.write(campaign_id, 0);
            self.campaign_status.write(campaign_id, true);

            self.campaign_count.write(campaign_id + 1_u128);

            self.emit(CreatedCampaign {campaign_id, athlete, amount});
        }

        fn sponsor(ref self: ContractState, campaign_id: u128, amount: u256) {
            let campaign_amount = self.campaigns.read(campaign_id);
            assert!(campaign_amount > 0, "Campaign does not exists");

            let campaign_status = self.campaign_status.read(campaign_id);
            assert!(campaign_status, "Campaign is closed");

            let collected_amount = self.campaign_amount.read(campaign_id);
            let updated_campaign_amount = collected_amount + amount;
            assert!(campaign_amount >= updated_campaign_amount,
                "Deposited amount exceeds campaign limit");

            let sponsor = get_caller_address();
            let athlete = self.athlete_campaigns.read(campaign_id);

            let contract_address = get_contract_address();
            let token_address: ContractAddress = self.token_address.read();
            let approve: bool = IERC20Dispatcher{contract_address: token_address}.approve(contract_address, amount);
            assert!(approve, "Approve Failed!");

            let result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(sponsor, contract_address, amount);
            assert!(result, "Transfer Failed!");

            let contributed = self.athlete_sponsors.read((athlete, sponsor));
            let sponsorId = self.sponsor_count.read() + 1;
            self.sponsors.write(sponsorId, sponsor);
            self.athlete_sponsors.write((athlete, sponsor), contributed + amount);
            self.athlete_funded.write(athlete, self.athlete_funded.read(athlete) + amount);
            self.campaign_amount.write(campaign_id, updated_campaign_amount);
            self.athlete_campaigns.write(campaign_id, athlete);

            self.emit(Sponspored {sponsor, campaign_id, athlete, amount});
        }

        fn claim(ref self: ContractState, campaign_id: u128) {
            let campaign_status = self.campaign_status.read(campaign_id);
            assert!(campaign_status, "Campaign is closed");

            let amount = self.campaigns.read(campaign_id);
            let collected_amount = self.campaign_amount.read(campaign_id);
            assert!(amount <= collected_amount, "Campaign limit is not reached");

            let caller: ContractAddress = get_caller_address();
            let athlete = self.athlete_campaigns.read(campaign_id);

            assert!(caller == athlete,
                    "Only athlete who raised the campaign can claim");

            let contract_address = get_contract_address();
            let token_address: ContractAddress = self.token_address.read();
            
            let amount_after_fee: u256 = amount - (1/100);
            let claimed_result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, athlete, amount_after_fee);
            assert!(claimed_result, "Claim Failed!");

            let platform_fee: u256 = amount - amount_after_fee;
            let owner = self.owner.read();
            let fee_result: bool = IERC20Dispatcher{contract_address: token_address}.transfer_from(contract_address, owner, platform_fee);
            assert!(fee_result, "Fee Distribution Failed!");

            self.campaign_status.write(campaign_id, false);

            self.emit(Claimed {campaign_id, athlete, amount});
        }

        fn is_athlete_register(self: @ContractState, athlete: ContractAddress) -> bool {
            self.athletes.read(athlete)
        }

        fn sponsor_share(self: @ContractState, athlete: ContractAddress, sponsor: ContractAddress) -> u128 {
            if !self.is_athlete_register(athlete) {
                return 0_u128;
            }

            let sponsor_fund = self.athlete_sponsors.read((athlete, sponsor));

            if sponsor_fund == 0 {
                return 0_u128;
            }

            let total_funded = self.athlete_funded.read(athlete);

            (sponsor_fund/total_funded).try_into().unwrap()
        }

        fn get_sponsors_by_athlete(self: @ContractState, athlete: ContractAddress) -> Array<ContractAddress> {
            let sponsor_count = self.sponsor_count.read();
            let mut sponsor_array: Array<ContractAddress> = ArrayTrait::new();
            let mut index: u128 = 0;
            loop {
                if index == sponsor_count {
                    break;
                }
                let sponsor = self.sponsors.read(index);
                if self.athlete_sponsor_exists.read((athlete,sponsor)) {
                    sponsor_array.append(sponsor);
                }
                index = index + 1;
            };
            return sponsor_array;
        }
    }
}


// #[cfg(test)]
// mod tests {
//     use super::{ SportNetCrowdFunding, ISportNetCrowdFundingDispatcher, ISportNetCrowdFundingDispatcherTrait };
//     use starknet::{ ContractAddress, syscalls::deploy_syscall };

//     fn deploy_contract() -> ISportNetCrowdFundingDispatcher {
//         let mut calldata = ArrayTrait::new();
//         let (address0, _) = deploy_syscall(
//             SportNetCrowdFunding::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false
//         )
//             .unwrap();
//         let contract0 = ISportNetCrowdFundingDispatcher { contract_address: address0 };
//         contract0
//     }

//     #[test]
//     #[available_gas(1000000)]
//     fn test_get() {
//         let contract = deploy_contract();
//         let data = contract.get();

//         assert_eq!(0, data);
//     }

//     #[test]
//     #[available_gas(1000000)]
//     fn test_set() {
//         let contract = deploy_contract();
//         contract.set(10);
//         let data = contract.get();

//         assert_eq!(10, data);
//     }
// }

