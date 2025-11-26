#include <eosio/eosio.hpp>
#include <eosio/crypto.hpp>
#include <string>

using namespace eosio;

class [[eosio::contract]] rsa : public contract {
public:
   using contract::contract;

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

      // Call the RSA verification intrinsic
      bool ok = verify_rsa_sha256_sig(
         message.data(),
         message.size(),
         signature.c_str(),
         pk_itr->exponent.c_str(),
         pk_itr->modulus.c_str()
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
