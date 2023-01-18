<script lang="ts">
    import { parse } from "./parser";

    export let input: string;

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

    $: if (input != "") {
        ({ variables, ast } = parseAndCatch(input));
    }

    $: value = { length: variables.length, i: 0 } as unknown as boolean[] & {
        i: number;
    };
    $: assignment = new Proxy(value, {
        get: (target, prop) => {
            if (prop == "length") {
                return variables.length;
            } else {
                return (target.i >> (target.length - Number(prop) - 1)) & 1;
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
            {#each { length: variables.length ** 2 } as _, i}
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
{/if}

<style>
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
        margin: 20px;
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

    table.connectives-help {
        display: inline-block;
        text-align: center;
        font-size: 150%;
        font-family: "Ubuntu Mono";
        margin: 10px 0 0 0;
    }

    table.connectives-help td {
        width: 75px;
    }
</style>
