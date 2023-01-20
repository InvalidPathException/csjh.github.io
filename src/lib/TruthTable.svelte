<script lang="ts">
    import { toLatexVar } from "./ast";
    import { parse } from "./parser";

    export let input: string;

    async function exportToLatexVar() {
        let latex = `\\begin{center}\\begin{tabular}{${"c".repeat(variables.length)}|`;
        
        let keys: Record<string, [string, boolean]> = {};
        value.i = 0;
        const end = String(toLatexVar(ast, variables, assignment, keys));
        const negatedEnd = end.startsWith("\\neg ");
        const objKeys = Object.keys(keys);

        latex += "c".repeat(objKeys.length + 1 + +negatedEnd) + "}\n";
        latex += variables.map(v => `$${v}$`).join(" &\n");
        for (let i = 0, key = objKeys[i]; i < objKeys.length; i++, key = objKeys[i]) {
            const [ltx, _] = keys[key];
            latex += i + 1 == objKeys.length && !negatedEnd? 
                    ` &\n$${ltx}$`
                  : ` &\n$\\overbrace{${ltx}}^${key}$`;
        }
        if (negatedEnd) latex += ` &\n$${end}$`;
        latex += "\n\\\\\\hline\n";

        for (value.i = 0; value.i < 1 << variables.length; value.i++) {
            latex += Array.from(assignment).map(v => v ? "T" : "F").join(" & ") 
            keys = {};
            ast.toLatexVar(variables, assignment, keys);
            for (const key in keys) {
                const [_, v] = keys[key];
                latex += ` & ${v? "T" : "F"}`;
            }
            if (negatedEnd) latex += ` & ${ast.evaluate(assignment)? "T" : "F"}`;
            latex += " \\\\\n";
        }
        latex += "\\end{tabular}\\end{center}";

        await navigator.clipboard.writeText(latex);
        showCopied = true;
        setTimeout(() => showCopied = false, 1000);
    }

    async function exportToLatex() {
        let latex = `\\begin{center}\\begin{tabular}{${"c".repeat(variables.length)}|c}\n`;
        latex += variables.map(v => `$${v}$`).join(" &\n") + ` &\n$${ast.toLatex(variables)}$\n`;
        latex += "\\\\\\hline\n";
        for (let i = 0; i < 1 << variables.length; i++) {
            value.i = i;
            latex += Array.from(assignment).map(v => v ? "T" : "F").join(" & ") + ` & ${ast.evaluate(assignment) ? "T" : "F"}`;
            latex += " \\\\\n";
        }
        latex += "\\end{tabular}\\end{center}";

        await navigator.clipboard.writeText(latex);
        showCopied = true;
        setTimeout(() => showCopied = false, 1000);
    }

    function parseAndCatch(input: string) {
        try {
            const result = parse(input);
            error = undefined;
            return result;
        } catch (e) {
            error = e;
            return { variables: [], ast: {} };
        }
    }

    let error: { start: number; end: number; description: string } | undefined =
        undefined;
    let variables: string[] = [];
    let ast: any = {};
    let showCopied = false;

    $: if (input != "") {
        ({ variables, ast } = parseAndCatch(input));
    }

    // below is my attempt at a virtual bit array
    // mainly just wanted to try out proxies
    // TODO: make the typescript not burn your eyes :(
    $: value = { length: variables.length, i: 0 } as unknown as boolean[] & {
        i: number;
    };
    $: assignment = new Proxy(value, {
        get: (target, prop) => {
            if (prop == "length") {
                return variables.length;
            } else if (typeof prop == "string" && !isNaN(Number(prop))) {
                return !((target.i >> (target.length - Number(prop) - 1)) & 1);
            }
        }
    });
</script>

{#if error}
    <div class="truth-table-holder">
        <div class="syntax-error-holder">
            <span class="syntax-okay">
                {@html input.substring(0, error.start)}
            </span>
            <span class="syntax-error">
                {@html input.substring(error.start, error.end)}
            </span>
            <span class="syntax-okay">
                {@html input.substring(error.end)}
            </span>
        </div>
        <div class="syntax-error-explanation">
            {@html error.description}
        </div>
    </div>
{:else if input}
<div class="parent-holder">
    <div class="truth-table-holder">
        <table class="truthTable">
            <tr class="header">
                {#each variables as variable}
                    <th class="variable">
                        {variable}
                    </th>
                {/each}
                <th class="expression">
                    {@html ast.toString(variables)}
                </th>
            </tr>
            {#each { length: 1 << variables.length } as _, i}
                {@const n = value.i = i}
                <tr>
                    {#each assignment as v}
                        <td>
                            {v ? "T" : "F"}
                        </td>
                    {/each}
                    <td>
                        {ast.evaluate(assignment) ? "T" : "F"}
                    </td>
                </tr>
            {/each}
        </table>
    </div>

    <div class="inline-block">
        <button class="export-button" on:click={exportToLatexVar}>Export to LaTeX w/ variable substitution</button>
        <button class="export-button" on:click={exportToLatex}>Export to LaTeX</button>
    </div>

    {#if showCopied}
        <div class="copied">Copied to clipboard!</div>
    {/if}
</div>
{/if}

<style>
    .inline-block {
        display: inline-block;
    }

    .copied {
        font-family: helvetica;
        color: #555;
        font-size: 10pt;
        margin-bottom: 20px;
    }

    .parent-holder {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .export-button {
        background: #f1f1f7;
        border: 1px solid #f1f1f7;
        border-radius: 5px;
        padding: 5px 5px;
        font-size: 7pt;
        font-family: helvetica;
        color: #555;
        cursor: pointer;
        margin: 20px;
        text-align: center;
    }

    table.truthTable {
        font-family: helvetica;
        color: #555;
        border-collapse: collapse;
        font-size: 14pt;
        text-align: center;
    }

    table.truthTable tr td:last-child,
    table.truthTable tr th:last-child {
        border-right: 0;
    }

    table.truthTable th {
        font-weight: bold;
        padding: 5px 10px 5px 10px;
    }

    table.truthTable td,
    table.truthTable th {
        border-right: 1px solid rgb(210, 210, 221);
        padding: 5px 10px 5px 10px;
    }
    table.truthTable td {
        font-weight: 100;
    }
    table.truthTable td:last-child {
        font-weight: 600;
    }
    table.truthTable tr,
    table.truthTable th {
        border-bottom: 1px solid rgb(171, 170, 187);
    }
    table.truthTable tr:last-child {
        border-bottom: 0px;
    }

    div.truth-table-holder {
        border: 1px solid #f1f1f7;
        background: #fafafa;
        padding: 10px 18px;
        display: inline-block;
        margin: 20px 20px 0 20px;
    }

    span.syntax-error {
        color: #ff8080;
        font-weight: bold;
        font-family: monospace;
        font-size: 20pt;
    }

    span.syntax-okay {
        color: #202020;
        font-family: monospace;
        font-size: 20pt;
    }
</style>
