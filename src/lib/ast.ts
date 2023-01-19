/******************************************************************************
 * File: ast.js
 * Author: Keith Schwarz (htiek@cs.stanford.edu)
 *
 * Types representing AST nodes in a parse tree.
 */

/* All AST nodes must have functions of the form
 *
 *   evaluate(assignment), which returns the value of the expression given the
 *                         variable assignment as an array of trues and falses.
 *   toString(variables),  which produces a human-readable representation of the
 *                         AST rooted at the node given the variables information.
 *                         in variables. The expression should have parentheses
 *                         added as appropriate.
 */

export interface Node {
    evaluate: (assignment: Node[]) => boolean | Node;
    toString: (variables: Node[]) => string | Node;
    toLatex: (variables: Node[]) => string | Node;
}

/*** Node type for T. ***/
export function trueNode(): Node {
    return {
        evaluate: () => true,
        toString: () => "&#8868;",
        toLatex: () => "T",
    }
}

/*** Node type for F. ***/
export function falseNode(): Node {
    return {
        evaluate: () => false,
        toString: () => "&#8869;",
        toLatex: () => "F",
    }
}

/*** Node type for ~. ***/
export function negateNode(underlying: Node): Node {
    return {
        evaluate: (assignment) => !underlying.evaluate(assignment),
        toString: (variables) => "&not;" + underlying.toString(variables),
        toLatex: (variables) => "\\neg " + underlying.toLatex(variables),
    }
}

/*** Node type for /\ ***/
export function andNode(lhs: Node, rhs: Node): Node {
    return {
        evaluate: (assignment) => lhs.evaluate(assignment) && rhs.evaluate(assignment),
        toString: (variables) => "(" + lhs.toString(variables) + " &and; " + rhs.toString(variables) + ")",
        toLatex: (variables) => "(" + lhs.toLatex(variables) + " \\land " + rhs.toLatex(variables) + ")",
    }
}

/*** Node type for \/ ***/
export function orNode(lhs: Node, rhs: Node): Node {
    return {
        evaluate: (assignment) => lhs.evaluate(assignment) || rhs.evaluate(assignment),
        toString: (variables) => "(" + lhs.toString(variables) + " &or; " + rhs.toString(variables) + ")",
        toLatex: (variables) => "(" + lhs.toLatex(variables) + " \\lor " + rhs.toLatex(variables) + ")",
    }
}

/*** Node type for -> ***/
export function impliesNode(lhs: Node, rhs: Node): Node {
    return {
        evaluate: (assignment) => !lhs.evaluate(assignment) || rhs.evaluate(assignment),
        toString: (variables) => "(" + lhs.toString(variables) + " &rarr; " + rhs.toString(variables) + ")",
        toLatex: (variables) => "(" + lhs.toLatex(variables) + " \\implies " + rhs.toLatex(variables) + ")",
    }
}


/*** Node type for <-> ***/
export function iffNode(lhs: Node, rhs: Node): Node {
    return {
        evaluate: (assignment) => lhs.evaluate(assignment) === rhs.evaluate(assignment),
        toString: (variables) => "(" + lhs.toString(variables) + " &harr; " + rhs.toString(variables) + ")",
        toLatex: (variables) => "(" + lhs.toLatex(variables) + " \\iff " + rhs.toLatex(variables) + ")",
    }
}

/*** Node type for ^ ***/
export function xorNode(lhs: Node, rhs: Node): Node {
    return {
        evaluate: (assignment) => lhs.evaluate(assignment) !== rhs.evaluate(assignment),
        toString: (variables) => "(" + lhs.toString(variables) + " &oplus; " + rhs.toString(variables) + ")",
        toLatex: (variables) => "(" + lhs.toLatex(variables) + " \\oplus " + rhs.toLatex(variables) + ")",
    }
}

/*** Node type for variables ***/
export function variableNode(index: number): Node {
    return {
        evaluate: (assignment) => assignment[index],
        toString: (variables) => variables[index],
        toLatex: (variables) => variables[index],
    }
}
