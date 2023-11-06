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

  const handleGetMessages = async (totalWeight) => {
    const rawMessages = await getMessages();
    if (rawMessages === undefined) return;
    const enrichedMessages = rawMessages.map((message) => {
      let rate = getCompletionRate(message.signed_validators, totalWeight);
      return {
        ...message,
        completion: rate,
      };
    });
    setMessages(enrichedMessages);
  };

  const handleSignMessage = async (message) => {
    const privateKey = localStorage.getItem("privateKey");
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
    handleGetMessages(totalWeight);
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
                              {signed_validators.map(({ validatorAddress }) => (
                                <Tooltip
                                  key={validatorAddress}
                                  content={validatorAddress}
                                >
                                  <Blockies
                                    data-testid="avatar"
                                    seed={validatorAddress?.toLowerCase() || ""}
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
                            {signed_validators.find(
                              (validator) =>
                                validator.wallet_address === address
                            ) ? (
                              <div className="container w-[70%]">
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
                              <div className="container w-[70%]">
                                <Button
                                  color="green"
                                  size="md"
                                  className="w-full"
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
