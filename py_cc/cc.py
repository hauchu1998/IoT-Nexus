import json
from typing import List

from py_cc.certificate import Attestor, CompactCertificate, Certificate
from py_cc.elliptic_curves.baby_jubjub import curve
from py_cc.hashes import (
    Poseidon, prime_254, matrix_254_3,
    round_constants_254_3
)


def gen_compact_certificate(
    message: str,
    attestors: List[Attestor],
    signed_attestors: dict  # Dict[Attestor, Signature]
):
    hash = Poseidon(
        prime_254,
        128,
        5,
        3,
        full_round=8,
        partial_round=57,
        mds_matrix=matrix_254_3,
        rc_list=round_constants_254_3,
    )
    Cc = CompactCertificate(message, hash, curve, len(attestors))
    Cc.setAttestors(attestors)
    Cc.setSignatures(signed_attestors)
    print(f"buildMerkleTree for message {message}")
    Cc.buildAttesterTree()
    Cc.buildSignTree()

    print("createMap")
    Cc.createMap()

    print("getCertificate")
    attester_root, message, proven_weight, cert, coins = Cc.getCertificate()

    # we save the certificate into a json file then pass to Zokrates to generate proof
    print(f"Certificate JSON for message {message}")
    test = Certificate(message, "PoseidonHash", "BabyJubjub", "EdDSA", cert)
    cert_json = test.toJSON()
    verify_json = [
        {
            "message": f"0x{hash.run(message).hexdigest()}",
        },
        {
            "attester_root": f"0x{attester_root}",
            "proven_weight": f"{proven_weight}",
        },
        cert_json["certificate"],
        coins,
    ]
    with open("zokratesjs/verify.json", "w") as file:
        json.dump(verify_json, file, indent=4)

    with open("zokrates/verify.json", "w") as file:
        json.dump(verify_json, file, indent=4)
