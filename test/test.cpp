#include <eosiolib/eosio.hpp>
#include <string>

using eosio::name;
using std::string;

class[[eosio::contract]] test : public eosio::contract
{
private:
  struct [[eosio::table]] dummy_type
  {
    uint64_t num = 0;
    uint64_t primary_key() const { return num; }
  };
  typedef eosio::multi_index<"dummies"_n, dummy_type> dummies_table;

public:
  using contract::contract;

  [[eosio::action]] void inlinefail() {
    dummies_table dummies(_self, _self.value);
    dummies.emplace(_self, [&](auto &dummy) {
      dummy.num = 1;
    });
    eosio::action(eosio::permission_level{_self, "active"_n},
                  _self, "fail"_n,
                  std::make_tuple())
        .send();
  };

  [[eosio::action]] void fail() {
    eosio_assert(false, "This was supposed to fail");
  };
};
EOSIO_DISPATCH(test, (inlinefail)(fail))
