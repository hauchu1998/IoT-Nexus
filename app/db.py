from datetime import timedelta
from random import randrange
import datetime
import random
from typing import Dict, Tuple


from py_cc.keys import PrivateKey
from py_cc.certificate import Attestor
from py_cc.signature import Signature as SignatureCc
from app.models import Validator, Message, Signature
from app.utils import sign_message, gen_sk

# ==================
# Define db
# ==================

tmp_key_map: Dict[str, PrivateKey] = {}
validators: Dict[str, Validator] = {}
attestors: Dict[str, Attestor] = {}
messages: Dict[str, Message] = {}
signatures: Dict[Tuple[str, Validator], SignatureCc] = {}

# ==================
# Define functions
# ==================


def save_tmp_key_map(address: str, private_key: PrivateKey):
    tmp_key_map[address] = private_key


def get_tmp_key_map(address: str):
    return tmp_key_map[address]


def get_validators(wallet_address: str):
    return validators[wallet_address]


def get_attestor(wallet_address: str):
    return attestors[wallet_address]


def save_message(message: str, wallet_address: str):
    messages[message] = Message(
        message=message,
        created_at=datetime.datetime.now(),
        created_by=wallet_address
    )


def update_ccip_url(message: str, transactionHash: str):
    messages[message].ccip_url = transactionHash


def save_signature(message: str, validator: Validator, signature: SignatureCc):
    messages[message].signed_validators[validator] = Signature(
        r=[str(signature.r.x), str(signature.r.y)],
        s=str(signature.s)
    )
    signatures[(message, validator)] = signature


def get_signature_cc(message: str, validator: Validator) -> SignatureCc:
    return signatures[(message, validator)]


def save_validator(private_key, public_key, weight, wallet_address):
    validator = Validator(
        public_key=public_key,
        private_key=private_key,
        weight=weight,
        wallet_address=wallet_address
    )
    validators[wallet_address] = validator
    return validator


def save_validator_and_attestor(sk: PrivateKey, weight, wallet_address):
    validator = Validator(
        public_key=sk.get_public_key().toString(),
        private_key=sk.toString(),
        weight=weight,
        wallet_address=wallet_address
    )
    validators[wallet_address] = validator

    attestors[wallet_address] = Attestor(
        public_key=sk.get_public_key(),
        private_key=sk,
        weight=weight
    )
    return validator


def get_messages():
    return messages.values()


# Create validators and messages for testing
N_VALIDATORS = 10
N_MESSAGES = 30
for i in range(N_VALIDATORS):
    sk = gen_sk()
    pk = sk.get_public_key()

    weight = random.randint(10000, 5000000)
    if i < 6:
        address = "0x" + "".join([random.choice("0123456789abcdef")
                                  for _ in range(40)])
    elif i == 6:
        address = "0xf8eB03DDa6a206504C21a27f625067Ce8EfeC8bd"
    elif i == 7:
        address = "0x3C4d46281Ace9ddd5fAB8438B6dfB92C553860E0"
    else:
        address = "0xE2A794de195D92bBA0BA64e006FcC3568104245d"
    tmp_key_map[address] = sk

    validator = Validator(
        public_key=pk.toString(),
        private_key=sk.toString(),
        weight=weight,
        wallet_address=address
    )
    validators[address] = validator

    attestor = Attestor(
        private_key=sk,
        public_key=pk,
        weight=weight
    )
    attestors[address] = attestor


def random_date(start, end):
    """
    This function will return a random datetime between two datetime 
    objects.
    """
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = randrange(int_delta)
    return start + timedelta(seconds=random_second)


today = datetime.datetime.now()
today_minus_3 = datetime.datetime.now() - datetime.timedelta(days=3)
for _ in range(N_MESSAGES):
    message = "".join([random.choice("0123456789abcdef") for _ in range(32)])
    created_by_v = random.choice(list(validators.values()))
    vs = random.choices(
        list(validators.values()), k=random.randint(0, N_VALIDATORS + 1))
    signed_validators = {}
    for v in vs:
        if v == created_by_v:
            continue
        signature = sign_message(
            message, attestor=get_attestor(v.wallet_address))
        signed_validators[v] = Signature(
            r=[str(signature.r.x), str(signature.r.y)],
            s=str(signature.s)
        )
        signatures[(message, v)] = signature

    messages[message] = Message(
        message=message,
        signed_validators=signed_validators,
        created_at=random_date(today_minus_3, today),
        created_by=created_by_v.wallet_address
    )
