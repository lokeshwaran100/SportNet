import { WalletItem } from "./ConnectWallet"
import { Connector } from "@starknet-react/core"

export type CustomDropDownProps={
    label: string;
    items: WalletItem[] | Connector[];
    isWalletDropDown: boolean;
};