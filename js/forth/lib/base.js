t.module('forth/lib/base', `

(--- Control Flow ---)

: then immediate
  ( condition )
  (cond: whether or not to execute body of 'then')

  (push the current) compile-sequence length (as location of dummy value)
  ( dummySpot )
  null (is the dummy value,) compile
  "jump-if-false" get compile

  (return: dummySpot)
;

: end immediate
  ( dummySpot )
  (dummySpot: the location in the compile-sequence of the dummy spot)

  (push the current) compile-sequence length (as jump destination)
  ( dummySpot dest )
  convert-to-literal
  ( dummySpot literal )
  swap
  ( literal dummySpot )
  compile-sequence swap
  ( literal list dummySpot )
  .set (of compile list indexed by location of dummy step)
;

: else immediate
  ( prev )
  (prev: location of previous dummy step)

  (prepare the jump to the end)
  (push current) compile-sequence length (as location of dummy value)
  ( prev cur )
  null (is dummy step) compile
  "jump" get compile
  swap
  ( cur | prev )

  (redirect 'then' to this spot)
  (push the current) compile-sequence length (as jump destination)
  convert-to-literal
  ( prev literal )
  swap
  ( literal prev )
  compile-sequence swap
  ( literal list prev )
  .set (of compile list indexed by location of dummy step)

  (return: cur)
;

: while immediate
  (push current) compile-sequence length (as restartPoint)
;

: do immediate
  ( restartPoint )

  (create branch point)
  (push current) compile-sequence length (as skipPoint)
  null compile
  "jump-if-false" get compile

  ( restartPoint skipPoint )
;

: done immediate
  ( restartPoint skipPoint )
  
  swap
  ( skipPoint restartPoint )
  convert-to-literal compile
  "jump" get compile
  ( skipPoint )
  (value:) compile-sequence length convert-to-literal
  (list:) compile-sequence
  (index:) -rot
  .set
;

: return immediate
  "process-list" get compile
  "length" get compile
  "jump" get compile
;

: [ immediate
  compile-sequence length
;

: ] immediate
  ( start )
  dup
  ( start start )
  compile-sequence length swap -
  ( start length )
  
  compile-sequence "splice" 2 .call
  
  convert-to-literal compile
;

(-- Importing Other Programs --)

: include ( name -- )
  get-program tokenize read
;

`);
