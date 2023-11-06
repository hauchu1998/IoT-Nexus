import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Switch,
  Input,
  Tooltip,
  Button,
  Progress,
} from "@material-tailwind/react";
import {
  HomeIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Blockies from "react-blockies";
import { getMessages } from "@/restApis/getMessages";
import "@/../public/css/tailwind.css";
import { ethers } from "ethers";
import useContract from "@/hooks/useContract";
import useEtherWallet from "@/hooks/useEtherWallet";

function CcipComponent({ sent }) {
  if (!sent) {
    return (
      <div className="container w-[70%]">
        <Button color="green" size="" className="w-full">
          Send
        </Button>
      </div>
    );
  }
}

function getCompletionRate(signed_validators, total_weight) {
  let signed_weight = 0;
  signed_validators.map(({ weight }, key) => {
    signed_weight += weight;
  });
  let rate = signed_weight / total_weight;
  return rate.toPrecision(2);
}

export function UserData() {
  const [storeData, setStoreData] = useState();
  const [data, setData] = useState();
  const { senderContract } = useContract();
  const { address } = useEtherWallet("dashboard/data");
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [totalWeight, setTotalWeight] = useState();
  const [messages, setMessages] = useState();

  const handleGetMessages = async (totalWeight) => {
    const rawMessages = await getMessages();
    if (rawMessages === undefined) return;
    const enrichedMessages = rawMessages
      .filter(
        (message) => message.created_by.toLowerCase() === address.toLowerCase()
      )
      .map((message) => {
        console.log(message);
        const rate = getCompletionRate(message.signed_validators, totalWeight);
        return {
          ...message,
          completion: rate,
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
    if (address) {
      handleGetData();
      handleGetTotalWeight();
    }
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
                            <td className={`flex-center-wrap ${className}`}>
                              <CcipComponent sent={ccip_sent} />
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
