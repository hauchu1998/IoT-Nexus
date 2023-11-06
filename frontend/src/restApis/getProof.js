import axios from "axios";
export const getProof = async (data) => {
  const res = await axios.post("http://localhost:8000/api/getProof", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};
