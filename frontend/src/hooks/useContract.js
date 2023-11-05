import { useMemo } from "react";
import { ethers, Contract } from "ethers";
import senderAbi from "@/abis/senderAbi";
import receiverAbi from "@/abis/receiverAbi";
import useEtherWallet from "./useEtherWallet";

const env = import.meta.env;

const useContract = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const senderRouter = env.VITE_SENDER_ROUTER || "";
  const senderContract = useMemo(
    () => new Contract(env.VITE_SENDER_ADDERSS || "", senderAbi, signer),
    [signer]
  );

  const receiverRouter = env.VITE_RECEIVER_ROUTER || "";
  const receiverContract = new Contract(
    env.VITE_RECEIVER_ADDERSS || "",
    receiverAbi,
    signer
  );
  return { senderRouter, senderContract, receiverRouter, receiverContract };
};

export default useContract;
