import axios from "axios";
export const getKey = async (data) => {
  const res = await axios.post("http://localhost:8000/api/getKey", data);
  return res.data;
};
