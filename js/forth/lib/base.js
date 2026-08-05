t.module(`

(--- Control Flow ---)

{
  ( define : ... ; parser )
  [
    read-token
  ]
  [
    nip
    dictionary
    ( name sequence dictionary )
    -rot .set
  ] ";" swap as-parser
  ( preParser parser )
  tuck "preParse" .set
  dictionary ":" .set

  ( define parser: ... ; parser )
  [
    read-token (name)
    read-token (ends)
    "/" swap "split" 1 .call
    ( name ends-list )
  ]
  [
    nip
    ( name ends sequence )
    as-parser
    dictionary
    ( name parser dictionary )
    -rot .set
  ] ";" swap as-parser
  tuck "preParse" .set
  dictionary "parser:" .set
}

{
  "end" [
    nip quote compile
    dictionary "endif" .get compile
  ] as-parser
  dictionary "end-if-parser" .set
}
parser: then else/end
  quote compile
  "end" =
  [
    [ ] quote compile
    dictionary "endif" .get compile
  ]
  [
    dictionary "end-if-parser" .get run-parser
  ]
  endif
;

(-- Importing Other Programs --)

: include ( name -- )
  get-program tokenize read
;

`);
