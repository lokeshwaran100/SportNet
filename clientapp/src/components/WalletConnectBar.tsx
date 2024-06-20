"use client";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

const WalletConnectBar =()=>{
  const { connectors, connect } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  return (
    <>
    {address ? <Button onClick={() => disconnect()} variant={"destructive"}>Disconnect</Button>:<DropdownMenu>
      <DropdownMenuTrigger><Button variant={"constructive"}>Connect</Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        {connectors.map((connector: any, index: number) => (
          <DropdownMenuItem 
            key={connector.id}
            onClick={() => connect({ connector })}>
              {connector.id}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>}
    </>
  )
}

export default WalletConnectBar;

