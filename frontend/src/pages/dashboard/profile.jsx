import {
  Card,
  CardBody,
  Typography,
  Input,
  Tooltip,
  Button,
  Progress,
} from "@material-tailwind/react";
import { useEffect, useState } from "react";
import Blockies from "react-blockies";
import { getMessages } from "@/restApis/getMessages";
import "@/../public/css/tailwind.css";
import { ethers } from "ethers";
import useContract from "@/hooks/useContract";
import useEtherWallet from "@/hooks/useEtherWallet";
import { getProof } from "@/restApis/getProof";
import { useNavigate } from "react-router-dom";
import { getCompletionRate } from "@/utils/calculate";

const DESTINATION_CHAIN_SELECTOR = import.meta.env.DESTINATION_CHAIN_SELECTOR;
const RECEIVER_ADDRESS = import.meta.env.RECEIVER_ADDRESS;

export function UserData() {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState();
  const [data, setData] = useState();
  const { senderContract } = useContract();
  const { address } = useEtherWallet("dashboard/data");
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [totalWeight, setTotalWeight] = useState();
  const [messages, setMessages] = useState();

  const handleSendMessageCCIP = async (message) => {
    const proof = await getProof({
      message,
    });

    const tx = await senderContract.sendMessageCCIP(
      BigInt(DESTINATION_CHAIN_SELECTOR),
      RECEIVER_ADDRESS || "",
      message,
      proof
    );
    await tx.wait();
  };

  const handleGetMessages = async (totalWeight) => {
    const rawMessages = await getMessages();
    if (rawMessages === undefined) return;
    const enrichedMessages = rawMessages
      .filter(
        (message) => message.created_by.toLowerCase() === address.toLowerCase()
      )
      .map((message) => {
        const rate = getCompletionRate(message.signed_validators, totalWeight);
        const currentDate = new Date();
        const createdAt = new Date(message.created_at);
        const diff = currentDate.getTime() - createdAt.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return {
          ...message,
          completion: rate,
          left: 7 - days > 0 ? 7 - days : 0,
        };
      });
    setMessages(enrichedMessages);
  };

  const handleGetTotalWeight = async () => {
    const weight = await senderContract.totalStakes();
    setTotalWeight(Number(weight));
  };

  const handleGetData = async () => {
    const data = await senderContract.getData(address);
    setStoreData(data);
  };

  const handleStoreData = async () => {
    setIsStoreLoading(true);
    const tx = await senderContract.storeData(data);
    await tx.wait();
    handleGetData();
    setData("");
    setIsStoreLoading(false);
  };

  const handleGenerateMessage = async () => {
    setIsGenerateLoading(true);
    const tx = await senderContract.generateMessage();
    await tx.wait();
    setData("");
    setStoreData();
    setIsGenerateLoading(false);
  };

  const handleDataChange = (e) => {
    e.preventDefault();
    setData(e.target.value);
  };

  useEffect(() => {
    if (address === undefined) return;
    handleGetData();
    handleGetTotalWeight();
  }, [address]);

  useEffect(() => {
    if (address === undefined || totalWeight === undefined) return;
    console.log(address, totalWeight);
    handleGetMessages(totalWeight);
  }, [totalWeight, address]);

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url(https://images.unsplash.com/photo-1531512073830-ba890ca4eba2?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80)] bg-cover	bg-center">
        <div className="absolute inset-0 h-full w-full bg-blue-500/50" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Blockies
                data-testid="avatar"
                seed={address?.toLowerCase() || ""}
                scale={7}
                size={7}
              />
              <div>
                <Typography variant="h6" color="blue-gray" className="mb-1">
                  {address || ""}
                </Typography>
              </div>
            </div>
          </div>
          <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Generate Your Message
              </Typography>
              {storeData &&
                storeData.map((el, index) => (
                  <div key={el + index} className="mt-2">{`${
                    index + 1
                  }. ${el}`}</div>
                ))}
              <div className="mt-2 flex items-center gap-3">
                <Input
                  type="text"
                  label="Store Data"
                  size="lg"
                  value={data}
                  onChange={handleDataChange}
                />
                <Button color="blue" onClick={handleStoreData}>
                  Store
                </Button>
                {isStoreLoading && <Typography>Loading...</Typography>}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Button color="blue" onClick={handleGenerateMessage}>
                  Generate Message
                </Button>
                {isGenerateLoading && <Typography>Loading...</Typography>}
              </div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Your Message
            </Typography>
            <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    {[
                      "messages",
                      "members",
                      "completion",
                      "create at",
                      "left",
                      "ccip",
                    ].map((el) => (
                      <th
                        key={el}
                        className="border-b border-blue-gray-50 py-3 px-6 text-left"
                      >
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium uppercase text-blue-gray-400"
                        >
                          {el}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {messages &&
                    messages.map(
                      (
                        {
                          message,
                          signed_validators,
                          created_at,
                          ccip_sent,
                          completion,
                          left,
                        },
                        key
                      ) => {
                        const className = `py-3 px-5 ${
                          key === messages.length - 1
                            ? ""
                            : "border-b border-blue-gray-50"
                        }`;

                        return (
                          <tr key={message}>
                            <td className={className}>
                              <div className="flex items-center gap-4">
                                {/* <Avatar src={img} alt={message} size="sm" /> */}
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-bold"
                                >
                                  {message}
                                </Typography>
                              </div>
                            </td>
                            <td className={`${className}`}>
                              <div className="members-container">
                                {signed_validators.map(
                                  ({ wallet_address, weight }, key) => (
                                    <Tooltip
                                      key={wallet_address}
                                      content={wallet_address}
                                    >
                                      {/* <Avatar
                                src={img}
                                alt={name}
                                size="xs"
                                variant="circular"
                                className={`cursor-pointer border-2 border-white ${
                                  key === 0 ? "" : "-ml-2.5"
                                }`}
                              /> */}
                                      <Blockies
                                        data-testid="avatar"
                                        seed={
                                          wallet_address.toLowerCase() || ""
                                        }
                                        scale={5}
                                        size={3}
                                        className="rounded-full"
                                      />
                                    </Tooltip>
                                  )
                                )}
                              </div>
                            </td>
                            <td className={className}>
                              <div className="w-10/12">
                                <Typography
                                  variant="small"
                                  className="mb-1 block text-xs font-medium text-blue-gray-600"
                                >
                                  {completion * 100}%
                                </Typography>
                                <Progress
                                  value={100}
                                  variant="gradient"
                                  color={99 === 100 ? "green" : "blue"}
                                  className="h-1"
                                />
                              </div>
                            </td>
                            <td className={className}>
                              <Typography
                                variant="small"
                                className="text-xs font-medium text-blue-gray-600"
                              >
                                {created_at}
                              </Typography>
                            </td>
                            <td className={className}>
                              <Typography
                                variant="small"
                                className="text-xs font-medium text-blue-gray-600"
                              >
                                {left} days left
                              </Typography>
                            </td>
                            <td className={`flex-center-wrap ${className}`}>
                              {!ccip_sent && completion > 0.7 && left >= 0 && (
                                <div className="container w-full">
                                  <Button
                                    color="green"
                                    size="md"
                                    className="w-full"
                                    onClick={() =>
                                      handleSendMessageCCIP(message)
                                    }
                                  >
                                    Send
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>
            </CardBody>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export default UserData;
