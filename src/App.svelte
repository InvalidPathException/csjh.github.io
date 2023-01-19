<script lang="ts">
    import TruthTable from "./lib/TruthTable.svelte";

    let input = "";
</script>

<div class="content">
    <h1 class="title">Truth Table Generator</h1>
    <a href="https://web.stanford.edu/class/cs103/tools/truth-table-tool/">Based on Keith Schawrz' original design</a>
    <p class="overview">
        This tool generates truth tables for propositional logic formulas. You
        can enter logical operators in several different formats. For example,
        the propositional formula <nobr>p &and; q &rarr; &not;r</nobr> could be
        written as
        <nobr><tt>p /\ q -&gt; ~r</tt></nobr>, as
        <nobr><tt>p and q =&gt; not r</tt></nobr>, or as
        <nobr><tt>p &amp;&amp; q -&gt; !r</tt></nobr>. The connectives &#8868;
        and &#8869; can be entered as <tt>T</tt> and <tt>F</tt>.
    </p>
    <p>
        <input
            id="expressionInput"
            type="text"
            bind:value={input}
            placeholder="Enter a formula"
        />
    </p>
    <div id="table-target">
        <TruthTable bind:input />
    </div>
</div>

<style>
    input#expressionInput {
        font-family: monospace;
        font-size: 20px;
        margin: 20px 0 0 0;
    }

    div.content {
        border-radius: 10px;
        display: inline-block;
        border: 5px solid #8080c0;
        margin-left: auto;
        margin-right: auto;
        vertical-align: top;
        min-width: 800px;
    }

    h1.title {
        color: #4040a0;
    }

    p.overview {
        width: 600px;
        text-align: justify;
        font-size: 13pt;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 0px;
    }

    tt {
        font-family: "Ubuntu Mono";
    }
</style>
