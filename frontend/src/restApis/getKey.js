import axios from "axios";
export const getKey = async (data) => {
  console.log(data);
  const res = await axios.post("/api/getKey", data);
  console.log(res);
  return res.data;
};
