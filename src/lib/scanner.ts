/******************************************************************************
 * File: scanner.js
 * Author: Keith Schwarz (htiek@cs.stanford.edu)
 *
 * A scanner to convert expressions from text into a propositional logic token
 * stream and associated variable <-> index map.
 *
 * The tokens can be any of these operators:
 *
 *    /\   \/  ->  <->  ~
 *
 * They can also be the special symbols T and F, parentheses, variables, or a
 * special EOF marker.
 */

export enum kScannerConstants {
    EOF = "$" // EOF marker placed internally in the string
}

/* Function: scan(input)
 *
 * Scans the input string and produces an object with two fields:
 *
 *   tokens:    A list of the tokens in the input, in order.
 *   variables: A list of the variables keyed by their index. See below.
 *
 * For simplicity, each variable is replaced by a numeric code based on its
 * alphabetical index. For example, if the variables are p, q, and r, then
 * p would get value 0, q would get value 1, and r would get value 2. The
 * "variables" array would then be ["p", "q", "r"].
 *
 * The final token in the stream will be the token EOF, which the parser can then
 * use as needed.
 *
 * If a lexical error occurs, an error object is thrown. The error will contain
 * this information:
 *
 *   description: A human-readable description of the error.
 *   start:       The index into the string at which the error starts (inclusive).
 *   end:         The index into the string at which the error ends (exclusive).
 */
export function scan(input: string) {
    /* Check that the input does not contain any invalid characters. */
    checkIntegrity(input);

    /* Get a preliminary scan in which variables are named rather than
     * numbered.
     */
    const preliminary = preliminaryScan(input);

    /* Convert the preliminary scan into the result by sorting variables by
     * name and renumbering them.
     */
    return numberVariables(preliminary);
}

/* Function: preliminaryScan
 *
 * Does a preliminary scan of the input. The preliminary scan is identical to
 * the final scan, except that the variables are named rather than numbered.
 * The returned object will have two fields:
 *
 *    tokens:      The tokens in the input.
 *    variableSet: A dictionary of all the tokens named in the input.
 */
function preliminaryScan(input: string) {
    /* Append a special $ marker to the end of the input. This will serve as our
     * EOF marker and eliminates a lot of special cases in input handling.
     */
    input += kScannerConstants.EOF;

    /* Run the scan! */
    let i = 0; // Index into the string
    const variableSet = {}; // Set of variables in use
    const tokens: {
        type: string;
        start: number;
        end: number;
        index?: string;
    }[] = []; // List of tokens

    while (true) {
        const curr = input.charAt(i); // Current character

        /* Stop on EOF if we find it. */
        if (curr === kScannerConstants.EOF) {
            tokens.push(makeIdentityToken(curr, i));
            return {
                tokens: tokens,
                variableSet: variableSet
            };
        } else if (isVariableStart(input, i)) {
            /* If we're reading a variable, pull the whole variable. */
            /* We're going to do variables in a two-step process. First, we're going to
             * read the variables and store them by name. Afterwards, we'll postprocess
             * them to replace each variable name with its index.
             */
            const variable = scanVariable(input, i, variableSet);
            tokens.push(makeVariableToken(variable, i, i + variable.length));

            /* Skip past the token characters. */
            i += variable.length;
        } else if (isOperatorStart(input, i)) {
            /* If we're reading an operator or other piece of syntax, pull the whole operator. */
            const token = tryReadOperator(input, i);
            /* token should not be null here. */

            tokens.push(makeIdentityToken(token, i));

            /* Skip the characters we just read. */
            i += token.length;
        } else if (isWhitespace(input.charAt(i))) {
            /* If we're reading whitespace, just skip it. */
            i++;
        } else {
            scannerFail(
                "The character " + input.charAt(i) + " shouldn't be here.",
                i,
                i + 1
            );
        }
    }
}

/* Function: makeIdentityToken
 *
 * Given a string that is its own token type, wraps that string up as a token for
 * the scanner.
 */
function makeIdentityToken(str: string, index: number) {
    return { type: translate(str), start: index, end: index + str.length };
}

/* Function: makeVariableToken
 *
 * Given a variable index, creates a token holding that variable index.
 */
function makeVariableToken(varIndex: string, start: number, end: number) {
    return { type: "variable", index: varIndex, start: start, end: end };
}

/* Function: isVariableStart
 *
 * Given the input to scan and an offset into that input, determines whether the
 * input beginning at that input is the name of a variable.
 *
 * Variable names must start with a letter or underscore, consist of letters and
 * underscores, and not be identically T or F.
 */
function isVariableStart(input: string, index: number) {
    return tryReadVariableName(input, index) !== null;
}

/* Function: tryReadVariableName
 *
 * Tries to read the name of a variable starting at the given index in the string.
 * If a variable name can be read, it is returned. If not, this function returns
 * null.
 */
function tryReadVariableName(input: string, index: number) {
    /* Need to start with a letter or underscore. */
    if (!/[A-Za-z_]/.test(input.charAt(index))) return null;

    /* Keep reading characters while it's possible to do so. */
    let result = "";
    while (/[A-Za-z_0-9]/.test(input.charAt(index))) {
        result += input.charAt(index);
        index++;
    }

    /* Return the result as long as it isn't a reserved word. */
    return isReservedWord(result) ? null : result;
}

/* Function: isReservedWord
 *
 * Returns whether the specified token is a reserved word.
 */
function isReservedWord(token: string) {
    return (
        token === "T" ||
        token === "F" ||
        token === "and" ||
        token === "or" ||
        token === "not" ||
        token === "iff" ||
        token === "implies" ||
        token === "true" ||
        token === "false" ||
        token === "xor"
    );
}

/* Function: scanVariable
 *
 * Given the string to scan, a start offset, and the variables list, scans a
 * variable out of the stream, adds it to the variable set, and returns the
 * name of the variable.
 *
 * It's assumed that we are indeed looking at a variable, so no error-handling
 * is done here.
 */
function scanVariable(
    input: string,
    index: number,
    variableSet: Record<string, boolean>
) {
    const variableName = tryReadVariableName(input, index);
    /* variableName should not be null here, by contract. */

    variableSet[variableName] = true;
    return variableName;
}

/* Function: isOperatorStart
 *
 * Given the input to scan and a start index, returns whether there's an operator
 * at the current position.
 */
function isOperatorStart(input: string, index: number) {
    return tryReadOperator(input, index) !== null;
}

/* Function: translate
 *
 * Translates a lexeme into its appropriate token type. This is used, for example, to map
 * & and | to /\ and \/.
 */
const convert = {
    "/\\": "/\\",
    "&&": "/\\",
    "and": "/\\",
    "\u2227": "/\\",
    "\\land": "/\\",
    "\\wedge": "/\\",

    "\\/": "\\/",
    "||": "\\/",
    "or": "\\/",
    "\u2228": "\\/",
    "\\lor": "\\/",
    "\\vee": "\\/",

    "->": "->",
    "=>": "->",
    "\u2192": "->",
    "implies": "->",
    "\\to": "->",
    "\\rightarrow": "->",
    "\\Rightarrow": "->",
    "\\implies": "->",

    "<->": "<->",
    "<=>": "<->",
    "\u2194": "<->",
    "iff": "<->",
    "\\leftrightarrow": "<->",
    "\\Leftrightarrow": "<->",
    "\\equiv": "<->",
    "\\same": "<->",

    "~": "~",
    "not": "~",
    "!": "~",
    "\u00AC": "~",
    "\\lnot": "~",
    "\\neg": "~",

    "^": "^",
    "xor": "^",
    "\u2295": "^",
    "\\niff": "^",
    "\\oplus": "^",

    "T": "T",
    "\u22A4": "T",
    "true": "T",
    "\\top": "T",

    "F": "F",
    "\u22A5": "F",
    "false": "F",
    "\\bot": "F",
}
function translate(input: string) {
    return convert[input] ?? input;
}

/* Function: tryReadOperator
 *
 * Given the input to scan and a start index, returns the operator at the current
 * index if one exists, and null otherwise.
 */
const operators = Array(20).fill(null).map(() => []);
Object.keys(convert).forEach((key) => operators[key.length].push(key));

function tryReadOperator(input: string, index: number) {
    for (let i = operators.length - 1; i >= 0; i--) {
        if (index >= input.length - i) {
            continue;
        }
        const nChars = input.substring(index, index + i);
        if (operators[i].includes(nChars)) {
            return nChars;
        }
    }

    /* If we got here, nothing matched. */
    return null;
}

/* Function: isWhitespace
 *
 * Returns whether the given character is whitespace.
 */
function isWhitespace(char: string) {
    return /\s/.test(char);
}

/* Function: scannerFail
 *
 * Triggers a failure of the scanner on the specified range of characters.
 */
function scannerFail(why: string, start: number, end: number) {
    throw { description: why, start: start, end: end };
}

/* Function: checkIntegrity
 *
 * Checks the integrity of the input string by scanning for disallowed characters.
 * If any disallowed characters are present, triggers an error.
 */
function checkIntegrity(input: string) {
    const okayChars =
        /[A-Za-z_0-9\\\/<>\-~^()\s\&\|\=\!\u2227\u2228\u2192\u2194\u22A4\u22A5\u00AC\u2295]/;
    for (let i = 0; i < input.length; i++) {
        if (!okayChars.test(input.charAt(i))) {
            scannerFail("Illegal character", i, i + 1);
        }
    }
}

/* Function: numberVariables
 *
 * Given the result of a preliminary scan, sorts the variables and renumbers them
 * alphabetically.
 *
 * The returned object has two fields:
 *
 *    tokens:    The tokens from the scan, with variables numbered.
 *    variables: An array mapping numbers to variable names.
 */
function numberVariables(preliminary: { tokens: any; variableSet: any }) {
    /* Add all the variables from the dictionary to an array so we can sort. */
    const variables = [];
    for (const key in preliminary.variableSet) {
        variables.push(key);
    }

    /* Sort the variables alphabetically. */
    variables.sort();

    /* Invert the array into the variable set for quick lookups. */
    for (let i = 0; i < variables.length; i++) {
        preliminary.variableSet[variables[i]] = i;
    }

    /* Change each variable's name to its index. */
    for (const token of preliminary.tokens) {
        if (token.type === "variable") {
            token.index = preliminary.variableSet[token.index];
        }
    }

    return {
        tokens: preliminary.tokens,
        variables: variables
    };
}
