#Creating Merkle trees for CC
import hashlib
import numpy as np
import random

#Create SK and PK using babyjubjub curve

PKs = ()

#Assign the Pks weights based on stakes and put them in descending weights


def create_weights(PKs):
    
    weights = ()
    attesters = ()
    
    for i in range(0, len(PKs)):
            weight = np.random.randint(1,1000)
            weights.append(weight)

    for i in range(len(PKs)):
        attesters = (PKs[i], weights[i])
        
    attesters = sorted(attesters, key=lambda x: x[1], reverse=True)
    provenWeight = sum(weights)
    
    return attesters, provenWeight


attesters, provenWeight = create_weights(PKs)

#Create Merkle tree of attestors (PK and weights)

def build_merkle_tree(elements):
    if len(elements) == 1:
        return elements[0][0].encode()

    # Combine adjacent pairs of elements and hash the result
    pairs = [(elements[i][0].encode() + elements[i+1][0].encode()) for i in range(0, len(elements), 2)]
    if len(elements) % 2 == 1:
        pairs.append(elements[-1][0].encode() * 2)

    # Hash each pair of elements together and store the resulting hash value
    hashes = [hashlib.sha256(pair).digest() for pair in pairs]

    # Recursively build the Merkle tree from the list of hash values
    return build_merkle_tree(hashes)

# Extract the attesters and weights into separate lists
attesters = [attester[0] for attester in attesters]
weights = [attester[1] for attester in attesters]

# Combine each attester with its weight into a tuple
elements = list(zip(attesters, weights))

# Build the Merkle tree from the list of attesters and weights
root_hash = build_merkle_tree(elements)

# Print the root hash of the Merkle tree
print("Merkle root hash:", root_hash.hex())


#Create merkle tree including Witness (Signed message by SK) and attestors range


#Create Random Oracle that tells us the subrange that the prover should select a tree from
def random_oracle(merkle_root_hash):
    nonce = random.getrandbytes(8)

    # Hash the Merkle root hash and nonce value together
    h = hashlib.sha256(merkle_root_hash + nonce.to_bytes(8, 'big')).digest()

    # Interpret the hash value as a number in the range from 0 to the sum of the weights
    random_number = int.from_bytes(h, 'big') % 6
    
    return random_number
