# Opti

A searchable, easily-styled replacement for select elements.

## Features

As with standard select elements, Opti elements can...

* be disabled or have their options disabled with the `disabled` attribute
* have pre-selected options with the `selected` attribute
* support multiple selections with the `multiple` attribute
* have grouped options using `section` elements

## Usage

Opti does not need to be initialized. Just include jQuery, the Opti script, and the required markup.

## Markup

Opti does not automatically inject near or in place of existing select elements. Specific markup must be in place for the Opti to initialize on. The expected markup structure is as follows:

* `.opti`
	* `a.surface`
		* `.placeholder` (optional for zero-state placeholder value)
	* `.dropdown`
		* `input.search[type=text]`
		* `section.list`
			* `section` (optional for grouping)
				* `span` (options--use `data-value` rather than `value`)
				* `span`
				* ...

For example:

```
<div class="opti" id="foods" multiple>
	<a href="#" class="surface"><span class="placeholder">Choose foods</span></a>
	<div class="dropdown">
		<input type="text" class="search" tabindex="-1">
		<section class="list">
			<span data-value="1">Apples</span>
			<span data-value="2">Oranges</span>
			<span data-value="3">Grapes</span>
		</section>
	</div>
</div>
```

## Value Storage

Opti elements store their current values using the jQuery `data()` method in the key "values". This is a string for single-select Opti elements and an array for multi-select ones. For example, to retrieve the current value on the above Opti element, one could use: `$("#foods").data("values")`. (This would retrieve the `data-value` of the currently chosen option, not the text.)

## Short Mode

If an Opti element has less than five items, it will enter "short mode" and nix its search feature.