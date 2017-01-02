# AsyncStack.js

AsyncStack is a project that focuses on defining and using functions like async / await. A common use of async.js is to save a lot of callbacks, but it uses a lot of anonymous functions in its use and has the disadvantage of limited use of parameters to pass to each function. So, in the scope of the function that surrounds async, there are a lot of patterns that put variables or objects in function scopes and use them as global variables.

AsyncStack improves code reusability by minimizing the use of anonymous functions and maximizes the convenience of passing parameter values freely between asynchronous functions using template parameters.

In addition, AsyncStack has more efficient memory management than async.js.

***
AsyncStack은 async/await와 비슷한 형태로 함수를 정의하고 사용할 수 있도록 하는데 중점을 둔 프로젝트입니다.
흔히 사용되는 async.js의 경우, 콜백을 많이 줄여주기는 하지만 사용함에 있어서 익명함수를 많이 사용하게 되며
각 함수에 전달할 매개변수의 사용의 설정이 제한적인 단점이 있습니다. 그래서 async를 감싸는 함수의 스코프 내에서
변수나 객체를 함수 스코프에 두고 전역변수처럼 사용하는 패턴을 많이 보입니다.

AsyncStack은 익명함수를 최대한 적게 사용할 수 있도록 해 코드의 재활용성을 높이고, 템플릿 매개변수를 활용해
비동기 함수간 자유롭게 인자값을 전달하고 받을 수 있도록 편의성을 최대화 했습니다.

이외에 AsyncStack은 async.js보다 메모리 관리를 효율적으로 하고 있습니다.

## Installation

Since you probably already have `node`, the easiest way to install `asyncstack` is through `npm`:

    $ npm install asyncstack --save
 
 

##Usage async/await
 ```javascript
 
async function asyncfunction1(){
    return 'result1'
}
 
async function asyncfunction2(arg){
     return arg;
} 
 
async function run(){
    let async1 = await asyncfunction1();
    let async2 = await asyncfunction2(async1);
}
 
run();  
 ```
  
##Usage comparison of AsyncStack
```javascript
let AsyncStack = require('asyncstack');

//stack is in first parameter instead of async  
function asyncfunction1(stack){
 //The current stack execution is complete 
 //and the result is passed as a parameter when the next stack is executed
 stack.done('result1');
}

function asyncfunction2(stack, args){
  stack.done(args);
} 

let stack = new AsyncStack();
stack.await(asyncfunction1)
     .await(asyncfunction2)
     .run();
```

## Quick Examples

```javascript

let AsyncStack = require('asyncstack');

//asyncfunction must have stack argument at first
function asyncfunction1(stack, args1, args2){
  //call stack.done when stack finish and define result for next asyncfunction
  stack.done('stack argument1', 'stack argument2' ...);
}

function asyncfunction2(stack){
  //all stack stop when call stack.error
  stack.error('error result');
}

let stack = new AsyncStack();
stack.await(asyncfunction1, args1, args2).await(asyncfunction2).run();

```


##### Async Instance Methods
|method |  parameters | desc|
|:-------|:-------|----|
|await | Function, Parameters to pass to function |Register function for asynchronous processing on stack| 
|pass  | Function, Parameters to pass to function |Register the function to be parallelized on the stack|
|done  | Function, Parameters to pass to function |Register callback function to be called when all stacks are completed|
|error | Function, Parameters to pass to function |Register callback function to be called when error occurs during stack execution|
|setVar | Variables name(string), Variables       |Register variables to use in the stack|
|getVar | Variables name(string)                  |Load registered variables in stack|
|run   | -                                        |Run stack|
-------------

AsyncStack 's await and pass - through functions are passed arguments to the stack as the first argument.
However, the passed stack is restricted to use some methods of AsyncStack, and has a different character than AsyncStack.

AsyncStack의 await와 pass를 통해 호출되는 함수는, 첫번째 인자값으로 stack처리를 위한 인자값을 전달받게 됩니다. 
하지만 이때 전달되는 stack은 AsyncStack의 일부 메소드를 사용할 수 있도록 제한되어 있어, AsyncStack과는 다른 성격을 가집니다.

##### Methods in stack function
|method |  parameters | desc|
|:-------|:-------|----|
|await | Function, Parameters to pass to function |Register function for asynchronous processing on stack| 
|pass  | Function, Parameters to pass to function |Register the function to be parallelized on the stack|
|done  | Parameters to pass to next stack         |Completion of current stack execution and passing result as parameter|
|error | Parameters to pass to error callback     |call when a stack error occurs|
|setVar | Variables name(string), Variables       |Register variables to use in the stack|
|getVar | Variables name(string)                  |Load registered variables in stack|

*Stacks running in a pass can not use the `await` method.*
 
*A variable registered as setVar can be used as a parameter in the form of a template such as `':VariableName'` when await / pass is called.*

## Basic

```javascript
function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.done(msg);
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        console.log(firstResult);
        console.log('second done');
        stack.done(firstResult);
    }, 1000);
}

function third(stack, secondResult){
    console.log(secondResult);
    console.log('third done');
    stack.done('call', 'complete', 'function');
}

let stack = new AsyncStack();
stack.await(first, 'hello').await(second).await(third);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();

// call results
//------------------------------------------------------------------------------
// first done
// hello
// second done
// hello
// third done
// [ [ 'hello' ], [ 'hello' ], [ 'call', 'complete', 'function' ] ]

```


## Advanced

```javascript
function stackInStack(stack){
    console.log('stack in stack');
    stack.await(second, ':firstResultValue');
    stack.await(third);
    stack.done();
}

function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.setVar('firstResultValue', `${msg} world`);
        stack.done();
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        console.log(firstResult);
        console.log('second done');
        stack.done(firstResult);
    }, 1000);
}

function third(stack, secondResult){
    console.log(secondResult);
    console.log('third done');
    stack.done('call', 'complete', 'function');
}

let stack = new AsyncStack();
stack.await(first, 'hello');
stack.await(stackInStack);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();

// call results
//------------------------------------------------------------------------------
// first done
// stack in stack
// hello world
// second done
// hello world
// third done
// [ null,
//   null,
//   [ 'hello world' ],
//   [ 'call', 'complete', 'function' ] ]
```

##Template Arguments
```javascript
function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.setVar('firstResultValue', `${msg} world`);
        stack.done();
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        stack.done("this is second result");
    }, 1000);
}

function third(stack, firstResult, secondResult) {
    console.log(firstResult, secondResult);
    setTimeout(function(){
        stack.done("this is third result");
    }, 1000);
}


let stack = new AsyncStack();
stack.await(first, 'hello');
stack.await(second, ':firstResultValue');
stack.await(third, ':firstResultValue', '?');
stack.done((stack)=>{
   console.log(stack.result());
});
stack.run();

// call results
//------------------------------------------------------------------------------
//first done
//hello world this is second result
//[ null, [ 'this is second result' ], [ 'this is third result' ] ]

```

## Error
```javascript
function stackInStack(stack){
    console.log('stack in stack');
    stack.await(second, ':firstResultValue');
    stack.await(third);
    stack.done();
}

function first(stack, msg){
    setTimeout(function(){
        console.log('first done');
        stack.setVar('firstResultValue', `${msg} world`);
        stack.done();
    }, 2000);
}

function second(stack, firstResult) {
    setTimeout(function(){
        console.log(firstResult);
        console.log('second done');
        stack.error('error!!!! all stack stop');
    }, 1000);
}

function third(stack, secondResult){
    console.log(secondResult);
    console.log('third done');
    stack.done('call', 'complete', 'function');
}

let stack = new AsyncStack();
stack.await(first, 'hello');
stack.await(stackInStack);
stack.done((stack)=>{
   console.log(stack.result());
});
stack.fail((error, stack)=>{
   console.error(error);
});
stack.run();

// call results
//------------------------------------------------------------------------------
// first done
// stack in stack
// hello world
// second done
// error!!!! all stack stop

```
