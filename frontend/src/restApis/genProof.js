import axios from "axios";
export const genProof = async (data) => {
  const res = await axios.post("http://localhost:8000/api/genProof", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};
