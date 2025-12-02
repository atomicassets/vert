#include <eosio/eosio.hpp>
#include <eosio/crypto.hpp>
#include <string>
#include <vector>

using namespace eosio;

class [[eosio::contract]] rsa : public contract {
public:
   using contract::contract;

   // Helper function to convert hex string to bytes
   static std::vector<uint8_t> hex_to_bytes(const std::string& hex) {
      std::vector<uint8_t> bytes;
      check(hex.length() % 2 == 0, "hex string must have even length");

      for (size_t i = 0; i < hex.length(); i += 2) {
         std::string byte_string = hex.substr(i, 2);
         uint8_t byte = (uint8_t)strtol(byte_string.c_str(), nullptr, 16);
         bytes.push_back(byte);
      }
      return bytes;
   }

   // Table to store RSA public keys
   struct [[eosio::table]] pubkey {
      uint64_t    index;
      std::string exponent;
      std::string modulus;

      uint64_t primary_key() const { return index; }
   };

   typedef multi_index<"pubkeys"_n, pubkey> pubkey_index;

   // Table to store verification results
   struct [[eosio::table]] result {
      uint64_t index;
      bool     ok;

      uint64_t primary_key() const { return index; }
   };

   typedef multi_index<"results"_n, result> result_index;

   // Action to set RSA public key
   [[eosio::action]]
   void setpubkey(uint64_t index, const std::string& exponent, const std::string& modulus)
   {
      require_auth(get_self());

      check(!exponent.empty(), "exponent cannot be empty");
      check(!modulus.empty(), "modulus cannot be empty");

      pubkey_index pubkeys(get_self(), get_self().value);

      auto itr = pubkeys.find(index);
      if (itr == pubkeys.end()) {
         // Create new entry
         pubkeys.emplace(get_self(), [&](auto& p) {
            p.index = index;
            p.exponent = exponent;
            p.modulus = modulus;
         });
      } else {
         // Update existing entry
         pubkeys.modify(itr, get_self(), [&](auto& p) {
            p.exponent = exponent;
            p.modulus = modulus;
         });
      }
   }

   // Action to verify RSA signature
   [[eosio::action]]
   void verify(uint64_t index, const std::string& message, const std::string& signature)
   {
      require_auth(get_self());

      check(!message.empty(), "message cannot be empty");
      check(!signature.empty(), "signature cannot be empty");

      // Retrieve public key
      pubkey_index pubkeys(get_self(), get_self().value);
      auto pk_itr = pubkeys.find(index);
      check(pk_itr != pubkeys.end(), "public key not found for index");

      // Convert hex string message to bytes
      // The message is expected to be a hex-encoded hash (e.g., SHA256 hash as hex string)
      auto message_bytes = hex_to_bytes(message);

      // Call the RSA verification intrinsic
      // VM will read these bytes and convert to hex for verification
      bool ok = verify_rsa_sha256_sig(
         message_bytes.data(),
         message_bytes.size(),
         signature.c_str(),
         pk_itr->exponent,
         pk_itr->modulus
      );

      // Store result
      result_index results(get_self(), get_self().value);
      auto res_itr = results.find(index);

      if (res_itr == results.end()) {
         results.emplace(get_self(), [&](auto& r) {
            r.index = index;
            r.ok = ok;
         });
      } else {
         results.modify(res_itr, get_self(), [&](auto& r) {
            r.ok = ok;
         });
      }
   }

   // Action to clear a result (for testing)
   [[eosio::action]]
   void clearresult(uint64_t index)
   {
      require_auth(get_self());

      result_index results(get_self(), get_self().value);
      auto itr = results.find(index);
      if (itr != results.end()) {
         results.erase(itr);
      }
   }
};
