/**
 * Safe math expression evaluator using recursive descent parsing.
 * Supports: +, -, *, /, %, ^, parentheses, unary minus, decimal numbers,
 * and functions: abs, sqrt, log, ln, round, floor, ceil, min, max, sin, cos, tan, asin, acos, atan.
 * Constants: pi, e.
 * Does NOT use eval().
 */
export default function evaluateExpression(expression: string): number {
    const tokens = tokenize(expression);
    const parser = new Parser(tokens);
    const result = parser.parseExpression();

    if (parser.hasRemainingTokens()) {
        throw new Error('Unexpected tokens at end of expression');
    }

    if (!isFinite(result)) {
        throw new Error(`Expression result is not a finite number: ${result}`);
    }

    return result;
}

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
    abs: Math.abs,
    sqrt: Math.sqrt,
    log: Math.log10,
    ln: Math.log,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    min: Math.min,
    max: Math.max,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
};

const CONSTANTS: Record<string, number> = {
    pi: Math.PI,
    e: Math.E,
};

type Token =
    | { type: 'number'; value: number }
    | { type: 'op'; value: string }
    | { type: 'paren'; value: '(' | ')' }
    | { type: 'comma' }
    | { type: 'func'; value: string };

function tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expr.length) {
        const ch = expr[i];

        if (ch === ' ' || ch === '\t') {
            i++;
            continue;
        }

        if (ch === '(' || ch === ')') {
            tokens.push({type: 'paren', value: ch});
            i++;
            continue;
        }

        if (ch === ',') {
            tokens.push({type: 'comma'});
            i++;
            continue;
        }

        if ('+-*/%^'.includes(ch)) {
            tokens.push({type: 'op', value: ch});
            i++;
            continue;
        }

        if (ch >= '0' && ch <= '9' || ch === '.') {
            let num = '';
            while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
                num += expr[i];
                i++;
            }
            tokens.push({type: 'number', value: parseFloat(num)});
            continue;
        }

        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
            let name = '';
            while (i < expr.length && ((expr[i] >= 'a' && expr[i] <= 'z') || (expr[i] >= 'A' && expr[i] <= 'Z'))) {
                name += expr[i];
                i++;
            }
            name = name.toLowerCase();
            if (name in CONSTANTS) {
                tokens.push({type: 'number', value: CONSTANTS[name]});
            } else if (name in FUNCTIONS) {
                tokens.push({type: 'func', value: name});
            } else {
                throw new Error(`Unknown function or constant: ${name}`);
            }
            continue;
        }

        throw new Error(`Unexpected character: ${ch}`);
    }

    return tokens;
}

class Parser {
    private position = 0;

    constructor(private tokens: Token[]) {}

    hasRemainingTokens(): boolean {
        return this.position < this.tokens.length;
    }

    parseExpression(): number {
        return this.parseAddition();
    }

    private parseAddition(): number {
        let left = this.parseMultiplication();

        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === 'op' && (token.value === '+' || token.value === '-')) {
                this.position++;
                const right = this.parseMultiplication();
                left = token.value === '+' ? left + right : left - right;
            } else {
                break;
            }
        }

        return left;
    }

    private parseMultiplication(): number {
        let left = this.parseExponent();

        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === 'op' && (token.value === '*' || token.value === '/' || token.value === '%')) {
                this.position++;
                const right = this.parseExponent();
                if (token.value === '*') left *= right;
                else if (token.value === '/') left /= right;
                else left %= right;
            } else {
                break;
            }
        }

        return left;
    }

    private parseExponent(): number {
        const base = this.parseUnary();

        if (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token.type === 'op' && token.value === '^') {
                this.position++;
                const exp = this.parseExponent(); // right-associative
                return Math.pow(base, exp);
            }
        }

        return base;
    }

    private parseUnary(): number {
        const token = this.tokens[this.position];

        if (token && token.type === 'op' && (token.value === '-' || token.value === '+')) {
            this.position++;
            const value = this.parseUnary();
            return token.value === '-' ? -value : value;
        }

        return this.parsePrimary();
    }

    private parsePrimary(): number {
        const token = this.tokens[this.position];

        if (!token) {
            throw new Error('Unexpected end of expression');
        }

        if (token.type === 'number') {
            this.position++;
            return token.value;
        }

        if (token.type === 'func') {
            this.position++;
            const open = this.tokens[this.position];
            if (!open || open.type !== 'paren' || open.value !== '(') {
                throw new Error(`Expected ( after ${token.value}`);
            }
            this.position++;

            const args: number[] = [this.parseExpression()];
            while (this.tokens[this.position]?.type === 'comma') {
                this.position++;
                args.push(this.parseExpression());
            }

            const closing = this.tokens[this.position];
            if (!closing || closing.type !== 'paren' || closing.value !== ')') {
                throw new Error(`Missing closing parenthesis for ${token.value}`);
            }
            this.position++;

            return FUNCTIONS[token.value](...args);
        }

        if (token.type === 'paren' && token.value === '(') {
            this.position++;
            const value = this.parseExpression();
            const closing = this.tokens[this.position];

            if (!closing || closing.type !== 'paren' || closing.value !== ')') {
                throw new Error('Missing closing parenthesis');
            }

            this.position++;
            return value;
        }

        throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
}
