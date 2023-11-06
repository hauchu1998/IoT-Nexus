import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import useEtherWallet from "@/hooks/useEtherWallet";
import { mediumAddress } from "@/utils/address";
import { getKey } from "@/restApis/getKey";
import { AiFillCloseCircle } from "react-icons/ai";
import useContract from "@/hooks/useContract";
import { singUp } from "@/restApis/signUp";

const SENDER_NETWORK = import.meta.env.VITE_SENDER_NETWORK;

export function SignUp() {
  const navigate = useNavigate();
  const { address, isConnect, connectWallet, switchNetwork } =
    useEtherWallet("sign-up");
  const { senderContract } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidator, setIsValidator] = useState(false);
  const [key, setKey] = useState();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);

  const handleCloseModal = () => {
    setIsOpenModal(false);
    setKey();
    navigate("/dashboard/home");
  };

  const handleStakeChange = (e) => {
    setStakeAmount(e.target.value);
  };

  const handleConnectWallet = async () => {
    const defaultAddress = await connectWallet();
    await switchNetwork(SENDER_NETWORK);
    // // send Post to backend
    const data = {
      wallet_address: defaultAddress,
    };
    const response = await getKey(data);
    setKey({
      publicKey: response.public_key,
      privateKey: response.private_key,
    });
  };

  const handleSetValidator = async () => {
    setIsLoading(true);
    const tx = await senderContract.setValidator(address, key.publicKey, {
      value: Number(stakeAmount),
      gasLimit: 1000000,
    });

    await tx.wait();
    const validator = await senderContract.getValidator(address);
    if (validator.isValid) {
      await singUp({
        wallet_address: address,
        weight: Number(stakeAmount),
      });
      setIsValidator(validator.isValid);
      setIsLoading(false);
      setIsOpenModal(true);
    }
  };

  return (
    <>
      <img
        src="https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 z-0 h-full w-full bg-black/50" />
      <div className="container mx-auto p-4">
        <Card className="absolute top-2/4 left-2/4 w-full max-w-[24rem] -translate-y-2/4 -translate-x-2/4">
          <CardHeader
            variant="gradient"
            color="blue"
            className="mb-4 grid h-28 place-items-center"
          >
            <Typography variant="h3" color="white">
              Sign Up
            </Typography>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {isConnect && address ? (
              <Input
                type="text"
                label="Wallet Address"
                size="lg"
                value={mediumAddress(address)}
                disabled
              />
            ) : (
              <Button className="bg-orange-500" onClick={handleConnectWallet}>
                Connect Wallet
              </Button>
            )}
            <div>
              <Input
                type="text"
                label="Stake Amount"
                size="lg"
                value={stakeAmount}
                onChange={handleStakeChange}
              />
              <div className="text-end text-sm text-red-300">
                minimum 10,000 wei
              </div>
            </div>

            {/* <div className="-ml-2.5">
              <Checkbox label="I agree the Terms and Conditions" />
            </div> */}
          </CardBody>
          <CardFooter className="pt-0">
            <Button variant="gradient" fullWidth onClick={handleSetValidator}>
              Sign Up
            </Button>
            {isLoading && (
              <Typography variant="small" className="mt-6 flex justify-center">
                Loading...
              </Typography>
            )}
            <Typography variant="small" className="mt-6 flex justify-center">
              Already have an account?
              <Link to="/auth/sign-in">
                <Typography
                  as="span"
                  variant="small"
                  color="blue"
                  className="ml-1 font-bold"
                >
                  Sign in
                </Typography>
              </Link>
            </Typography>
          </CardFooter>
        </Card>
        {isValidator && key && (
          <div className="fixed top-0 left-0 flex h-screen w-screen items-center justify-center ">
            <div className="border-2 border-blue-500 bg-white p-5 text-center">
              <div>
                This is you public and private key. Please save it somewhere
                safe.
                <br />
                <span className="font-bold text-red-500">
                  Remember once you close this modal, you will not be able to
                  see it again.
                </span>
              </div>
              <div className="mt-5 border-t border-gray-600">
                <div>
                  Public Key:{" "}
                  <span className="font-semibold text-blue-500">
                    {key?.publicKey}
                  </span>
                </div>
                <div>
                  Private Key:{" "}
                  <span className="font-semibold text-orange-500">
                    {key?.privateKey}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button
                  className="mt-5 text-xl text-blue-500"
                  onClick={handleCloseModal}
                >
                  <AiFillCloseCircle />
                </button>
                <div className="text-sm text-blue-500">close</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SignUp;
