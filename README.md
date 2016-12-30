# AsyncStack.js

## Quick Examples

```javascript

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

## Example (Basic)

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


## Example (Advanced)

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

##Example (Template Argument)
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

```

## Example (Error)
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
