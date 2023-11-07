import asyncio
import json
import subprocess
from typing import Annotated, List
from fastapi import FastAPI, Form
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from py_cc.cc import gen_compact_certificate
from app import db
from app import utils
from app.models import (
    SignMessageRequest, GenProofRequest, GenKeyRequest, PKeys,
    SaveMessageRequest
)

origins = [
    "http://localhost:5173",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/')
async def read_root():
    return {"message": "Event listener is running!"}


async def listen_to_events():
    w3 = utils.get_w3()
    contract_address = utils.get_contract_address()
    abi = utils.get_abi()
    contract = utils.get_contract(w3, contract_address, abi)
    event_msg_gen = contract.events.GenerateMessage
    event_ccip_sent = contract.events.MessageSent

    last_block_msg_gen = last_block_ccip_sent = w3.eth.get_block_number()
    while True:
        msg_gen_logs = utils.handle_sepolia_event(
            event_msg_gen, last_block_msg_gen)
        for log in msg_gen_logs:
            print("new message", log["args"]["message"])
            db.save_message(
                message=log["args"]["message"],
                wallet_address=log["args"]["user"]
            )
            last_block_msg_gen = log["blockNumber"] + 1

        ccip_sent_logs = utils.handle_sepolia_event(
            event_ccip_sent, last_block_ccip_sent)
        for log in ccip_sent_logs:
            print(log)
            print("new ccip request", log["args"]["text"])
            print("transactionHash", "0x"+log["args"]["messageId"].hex())
            db.update_ccip_url(
                message=log["args"]["text"],
                transactionHash="0x"+log["args"]["messageId"].hex()
            )
            last_block_ccip_sent = log["blockNumber"] + 1
        await asyncio.sleep(3)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(listen_to_events())


@app.post("/api/genProof")
async def genproof(request: GenProofRequest):
    message = db.messages[request.message]
    signed_attestors = {}
    for validator, signature in message.signed_validators.items():
        attestor = db.get_attestor(validator.wallet_address)
        sig_cc = db.get_signature_cc(message.message, validator)
        signed_attestors[attestor] = sig_cc
    gen_compact_certificate(
        message=message.message,
        attestors=list(db.attestors.values()),
        signed_attestors=signed_attestors,
    )

    # generate zkproof
    command_zoc = "cd zokratesjs && node index.js && cd .."
    try:
        subprocess.run(
            command_zoc,
            shell=True,
            capture_output=True).stdout.decode('utf-8')
    except subprocess.CalledProcessError as e:
        return Response(status_code=500, content=e.stderr)

    with open("./zokratesjs/proof.json") as f:
        proof = json.load(f)

    return JSONResponse(content=proof)


@app.post("/api/signMessage")
async def sign_message(request: SignMessageRequest):
    validator = db.get_validators(request.wallet_address)
    attestor = db.get_attestor(request.wallet_address)
    validator = db.get_validators(request.wallet_address)

    message = request.message
    signature = utils.sign_message(message, attestor)
    db.save_signature(message, validator, signature)
    return Response(status_code=200)


@app.post("/api/getKey")
async def get_key(request: GenKeyRequest):
    sk = utils.gen_sk()
    db.save_tmp_key_map(request.wallet_address, sk)
    keys = PKeys(
        public_key=sk.get_public_key().toString(),
        private_key=sk.toString()
    )
    return JSONResponse(
        content=jsonable_encoder(keys)
    )


@app.post("/api/signUp")
async def signup(
    wallet_address: Annotated[str, Form()],
    weight: Annotated[int, Form()]
):
    if wallet_address not in db.tmp_key_map:
        return Response(status_code=404)
    sk = db.get_tmp_key_map(wallet_address)

    db.save_validator_and_attestor(
        sk=sk,
        weight=weight,
        wallet_address=wallet_address
    )
    return Response(status_code=200)


@app.post("/api/signIn")
async def signin(wallet_address: Annotated[str, Form()]):
    if wallet_address in db.validators:
        return Response(status_code=200)
    return Response(status_code=404)


@app.get("/db/messages")
async def get_messages() -> List[dict]:
    messages = list(db.messages.values())
    return_messages = []
    for message in messages:
        res = {}
        for key, value in message:
            if key == "signed_validators":
                res[key] = [
                    utils.export_validator(v) for v in value
                ]
            else:
                res[key] = value
        return_messages.append(res)
    return return_messages


@app.post("/db/saveMessage")
async def save_message(request: SaveMessageRequest):
    db.save_message(message=request.message,
                    wallet_address=request.wallet_address)
