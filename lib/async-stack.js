'use strict';

class AsyncStack {
    constructor() {
        this.passCount = 0;
        this.isWork = false;
        this.passStack = [];
        this.error = null;
        this.result = [];
        this.failFn = null;
        this.failFnArgs = [];
        this.doneFn = null;
        this.doneFnArgs = [];
        this.stack = [];
        this.sandbox = null;
        this.stackArgs = [];
        this.variables = {};
        this.prependStack = [];
        this.prependStackArgs = [];
    }

    //--------------------------------------------------------------------------
    // Public Methods
    //--------------------------------------------------------------------------

    /**
     * Set variable for stack
     * @param key
     * @param value
     */
    setVar(key, value) {
        this.variables[key] = value;
    }

    /**
     * Get variable for stack
     * @param key
     * @returns {null}
     */
    getVar(key) {
        return this._getDescendantProp(this.variables, key);
    }

    /**
     * Delete variable
     * @param key
     */
    delVar(key) {
        delete this.variables[key];
    }

    /**
     * Push await stack
     * @param fn
     * @returns {WorkStack}
     */
    await(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not allowed await function');
        }

        this.stack.push(fn);
        this.stackArgs.push(args);
        return this;
    }

    /**
     * Run async stack
     * @param stack
     */
    pass(fn, ...args) {
        let stack = this.getSandBoxForPass();
        this.passCount++;
        fn.apply(this, [stack].concat(args));
        //stack 을 넘기는 부분에 설정값 넣어서 보낼 것
        return this;
    }

    /**
     * Mapping result variables with names
     * @param varName
     * @returns {AsyncStack}
     */
    setResultsName(...varName) {
        this.stack.push(function (stack, ...results) {
            for (let i = 0; i < results.length, i < varName.length; i++) {
                stack.setVar(varName[i], results[i]);
            }
            stack.done();
        });
        this.stackArgs.push(null);
        return this;
    }

    /**
     * push stack in stack
     * @param stack
     */
    _prepend(fn, ...args) {
        if (typeof fn !== 'function') {
            throw new Error('not allowed await function');
        }

        this.prependStack.push(fn);
        this.prependStackArgs.push(args);
        return this;
    }


    //--------------------------------------------------------------------------
    // Private Methods
    //--------------------------------------------------------------------------

    /**
     * Run await stack
     * @param args
     * @returns {*}
     */
    run(...args) {
        if (this.error !== null) {
            this.onError();
            return this.error;
        }
        //스택길이 체크
        else if (this.stack.length == 0) {
            this.doneFnArgs = this.doneFnArgs.concat(args);
            this.onDone();
            return false;
        }

        let fn = this.stack.shift();
        let fnArgs = this._checkStackTemplateArguments(args);

        let params = fnArgs[0] === undefined ? args : fnArgs.concat(args);

        this.sandbox = this.getSandbox();
        try {
            this.isWork = true;
            fn.apply(this, [this.sandbox].concat(params));
        } catch (e) {
            console.error('stack error', e);
            this.error = '500';
            this.onError();
        }
    }

    /**
     * convert template argument
     * @returns {T}
     * @private
     */
    _checkStackTemplateArguments(args) {
        let fnArgs = this.stackArgs.shift();
        let index = 0,
            variableName,
            variable,
            i = 0,
            len = fnArgs.length;

        for (; i < len; i++) {
            if (fnArgs[i] === '?') {
                fnArgs[i] = args[index];
                index++;
            } else if (typeof fnArgs[i] === 'string' && fnArgs[i].indexOf(':') === 0) {
                variableName = fnArgs[i].substr(1, fnArgs[i].length - 1);
                variable = this.getVar(variableName);
                if (this.getVar(variableName) !== undefined) {
                    fnArgs[i] = variable;
                }
            }
        }

        return fnArgs;
    }

    _getDescendantProp(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    /**
     * set callback when all stack finished
     * @param fn
     * @returns {WorkStack}
     */
    done(fn, ...args) {
        this.isWork = false;
        if (typeof fn !== 'function') {
            throw new Error('not allowed done function');
        }

        this.doneFnArgs = args.length > 0 ? args : [];
        this.doneFn = fn;
        return this;
    }


    /**
     * set callback when stack has error
     * @param fn
     * @returns {WorkStack}
     */
    fail(fn, ...args) {
        this.isWork = false;
        if (typeof fn !== 'function') {
            throw new Error('not allowed fail function');
        }

        this.failFnArgs = args.length > 0 ? args : [];
        this.failFn = fn;
        return this;
    }

    /**
     * Run when all stack finished
     */
    onDone() {
        if (this.isWork === true) {
            return;
        }

        //병렬로 실행중인 스택이 있다면 종료하지 않음
        if (this.passCount > 0) {
            return;
        }

        if (!!this.doneFn) {
            //done으로등록된 콜백이 AsyncStack 이라면 done 처리한다
            if (!!this.doneFn.__instance &&
                this.doneFn.__instance !== this &&
                //this.doneFn이 인자값으로 전달된 stack
                this.doneFn.__instance instanceof AsyncStack) {

                this.doneFn.done.apply(this, this.doneFnArgs);
                this.discard();
                return;
            }

            this.doneFn.apply(this, [this.sandbox].concat(this.doneFnArgs));
            //폐기
            this.discard();
        }
    }

    /**
     * Run when stack has error
     */
    onError() {
        if (this.failFn !== null) {
            this.failFn.apply(null, [this.error, this.sandbox].concat(this.failFnArgs));
            //폐기
            this.discard();
            this.failFn = null;
        }
    }

    _save(...args) {
        this.isWork = false;
        if (this.prependStack.length > 0) {
            this.stack = this.prependStack.concat(this.stack);
            this.stackArgs = this.prependStackArgs.concat(this.stackArgs);
            this.prependStack = [];
            this.prependStackArgs = [];
        }

        let result = args;
        if (args.length === 0) {
            result = null;
        }
        this.result.push(result);
        this.run(...args)
    }

    _saveForPass(id, ...args) {
        this.passCount--;
        this.passStack[id] = args;

        if (this.passCount == 0) {
            this.sandbox = this.getSandbox();
            this.onDone();
        }
    }

    _finish(...args) {
        this.isWork = false;
        let result = args;
        if (args.length === 0) {
            result = null;
        }
        this.result.push(result);
        this.doneFnArgs = this.doneFnArgs.concat(result);
        //console.log(this.doneFnArgs);
        this.onDone();
    }

    /**
     * 현재까지 실행완료된 wait 스택의 결과값
     * @returns {null|Array}
     */
    getResult() {
        return this.result;
    }

    /**
     * 현재까지 실행완료된 pass 스택의 결과값
     * @returns {null|Array}
     */
    getPassResult() {
        return this.passStack;
    }

    stop(error) {
        this._onError(error);
    }

    discard() {
        this.passCount = null;
        this.isWork = null;
        this.passStack = null;
        this.error = null;
        this.result = null;
        this.failFn = null;
        this.failFnArgs = null;
        this.doneFn = null;
        this.doneFnArgs = null;
        this.stack = null;
        this.sandbox = null;
        this.stackArgs = null;
        this.variables = null;
        this.prependStack = null;
        this.prependStackArgs = null;
    }

    _onError(error) {
        this.error = error;
        this.onError();
    }

    getSandBoxForPass() {
        let stackResult = null;
        let id = this.passStack.length;
        this.passStack.push(stackResult);
        return {
            _id: id,
            type: 'pass',
            setVar: this.setVar.bind(this),
            getVar: this.getVar.bind(this),
            pass: this.pass.bind(this),
            //await: this._prepend.bind(this),
            done: this._saveForPass.bind(this, id),
            error: this._onError.bind(this)
        }
    }

    getSandbox() {
        return {
            type: 'await',
            setVar: this.setVar.bind(this),
            getVar: this.getVar.bind(this),
            done: this._save.bind(this),
            finish: this._finish.bind(this),
            error: this._onError.bind(this),
            result: this.getResult.bind(this),
            pass: this.pass.bind(this),
            passResult: this.getPassResult.bind(this),
            await: this._prepend.bind(this),
            setResultsName: this.setResultsName.bind(this),
            __instance: this,
        }
    }
}


module.exports = AsyncStack;
