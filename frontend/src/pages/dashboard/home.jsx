import React, { useEffect, useState } from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Tooltip,
  Progress,
  Button,
} from "@material-tailwind/react";
import { CheckIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import "@/../public/css/tailwind.css";
import Blockies from "react-blockies";
import { getMessages } from "@/restApis/getMessages";
import { getCompletionRate } from "@/utils/calculate";
import useEtherWallet from "@/hooks/useEtherWallet";
import { useNavigate } from "react-router-dom";
import useContract from "@/hooks/useContract";
import { signMessage } from "@/restApis/signMessage";

export function ValidatePage() {
  const navigate = useNavigate();
  const { address, isConnect } = useEtherWallet("dashboard/home");
  const { senderContract } = useContract();
  const [totalWeight, setTotalWeight] = useState();
  const [messages, setMessages] = useState();

  const handleGetTotalWeight = async () => {
    const weight = await senderContract.totalStakes();
    setTotalWeight(Number(weight));
  };

  const handleGetMessages = async () => {
    const rawMessages = await getMessages();
    if (rawMessages === undefined) return;
    const enrichedMessages = rawMessages
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
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setMessages(enrichedMessages);
  };

  const handleSignMessage = async (message) => {
    if (address === undefined) return;
    const res = await signMessage({ message, wallet_address: address });
    const tx = await senderContract.signMessage(
      message,
      `${address} sign it`,
      2
    );
    await tx.wait();
    if (totalWeight !== undefined) {
      await handleGetMessages();
    }
  };

  useEffect(() => {
    if (!isConnect) return;
    if (address) {
      handleGetTotalWeight();
    } else {
      navigate("/auth/sign-in");
    }
  }, [address]);

  useEffect(() => {
    if (address === undefined || totalWeight === undefined) return;
    handleGetMessages();
  }, [totalWeight, address]);

  return (
    <div className="mt-12">
      <div className="mb-4 grid grid-cols-1 gap-6">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6"
          >
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-1">
                Messages To Sign
              </Typography>
              <Typography
                variant="small"
                className="flex items-center gap-1 font-normal text-blue-gray-600"
              >
                <CheckIcon strokeWidth={3} className="h-4 w-4 text-blue-500" />
                <strong>30 done</strong> this month
              </Typography>
            </div>
            <Menu placement="left-start">
              <MenuHandler>
                <IconButton size="sm" variant="text" color="blue-gray">
                  <EllipsisVerticalIcon
                    strokeWidth={3}
                    fill="currenColor"
                    className="h-6 w-6"
                  />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem>Sort by Date</MenuItem>
                <MenuItem>Sort by Company</MenuItem>
              </MenuList>
            </Menu>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {[
                    "messages",
                    "members",
                    "company",
                    "completion",
                    "create at",
                    "left",
                    "decision",
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
                        created_by,
                        created_at,
                        completion,
                        left,
                      },
                      index
                    ) => {
                      const className = `py-3 px-5 ${index === messages.length - 1
                          ? ""
                          : "border-b border-blue-gray-50"
                        }`;

                      return (
                        <tr key={message + index}>
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
                              {signed_validators.map(({ wallet_address }) => (
                                <Tooltip
                                  key={wallet_address}
                                  content={wallet_address}
                                >
                                  <Blockies
                                    data-testid="avatar"
                                    seed={wallet_address?.toLowerCase() || ""}
                                    scale={5}
                                    size={3}
                                    className="rounded-full"
                                  />
                                </Tooltip>
                              ))}
                            </div>
                          </td>
                          <td className={`${className}`}>
                            <div className="container">
                              <Blockies
                                data-testid="avatar"
                                seed={created_by.toLowerCase() || ""}
                                scale={5}
                                size={5}
                                className="rounded-full"
                              />
                              <Typography
                                variant="small"
                                className="text-xs font-medium text-blue-gray-600"
                                style={{ paddingLeft: "10px" }}
                              >
                                {created_by}
                              </Typography>
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
                                color={completion > 0.7 ? "green" : "blue"}
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
                            {signed_validators.find(
                              (validator) =>
                                validator.wallet_address === address
                            ) ? (
                              <div className="container w-full">
                                <Button
                                  disabled
                                  color="light-green"
                                  size="md"
                                  className="w-full"
                                >
                                  Signed
                                </Button>
                              </div>
                            ) : (
                              <div className="container w-full">
                                <Button
                                  color="green"
                                  size="md"
                                  className="w-full"
                                  onClick={() => handleSignMessage(message)}
                                >
                                  Approve
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
        </Card>
      </div>
    </div>
  );
}

export default ValidatePage;
