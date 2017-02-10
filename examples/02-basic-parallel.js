'use strict';
let AsyncStack = require('../lib/async-stack');

function first(stack, msg){
    setTimeout(function(){
        console.log(msg)
        console.log(1);
        stack.done(1);
    }, 2000);
    stack.pass(second);
}

function second(stack) {
    setTimeout(function(){
        console.log(2);
        stack.done(2);
    }, 1000);
    stack.await(fourth).pass(third);
}

function third(stack){
    console.log(3);
    stack.done(3);
}

function fourth(stack){
    console.log(4);
    stack.done(4);
}

let stack = new AsyncStack();
stack.await(first, 'hello');
stack.done((stack)=>{
   console.log('complete');
});
stack.run();

/* call flow first > second > fourth > third
------------------------------------------------------------------------------
hello
1
2
4
3
complete
*/