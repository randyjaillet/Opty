# Opti

A searchable, easily-styled replacement for select elements.

## Features

Opti elements will reflect the characteristics of their corresponding select elements. They support...

* being disabled or having their options disabled with the `disabled` attribute
* having pre-selected options with the `selected` attribute
* multiple selections with the `multiple` attribute
* optgroups (these become sections in the Opti and their labels H5s)

## Usage

Include jQuery and the Opti script, then initialize Opti. You can initialize it on the specific select elements you wish to target or a parent container of all the select elements you want to target.

```
<script type="text/javascript" src="//code.jquery.com/jquery-1.12.0.min.js"></script>
<script type="text/javascript" src="/js/jquery.opti.js"></script>
<script>
$(
	function () {

		$("select").opti();

	}
)
</script>
```

## Markup

Opti automatically injects immediately after targeted select elements. What follows is the markup structure that is injected.

* `.opti` (will have an id of "foo-opti" where "foo" is the id of the targeted select element.)
	* `a.surface`
	* `.dropdown`
		* `input.search[type=text][tabindex=-1]`
		* `section.list`
			* `section` (optional for grouping)
				* `span` (options--use `data-value` rather than `value`)
				* `span`
				* ...

For example:

```
<select id="foods" multiple>
	<option value="0">Choose foods</option>
	<option value="1">Apples</option>
	<option value="2">Oranges</option>
	<option value="3">Grapes</option>
</select>
<div class="opti" id="foods-opti" multiple>
	<a href="#" class="surface">Choose foods</a>
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

Opti elements use the original select elements to store their values. This way, submitted forms will automatically include the correct values without requiring JS manipulation.

## Options

Opti takes options passed in an object on initialization.

```
$("select").opti(
	{
		shortModeThreshold : 10
	}
);
```

### `shortModeThreshold`

If an Opti has less than this number of options, it will enter "short mode" and the search will be nixed. Default is 5.

### `useFirstOptionAsPlaceholder`

If set to `true`, the first option of the select will be removed in the Opti and its text inserted into the Opti's surface as a placeholder. If set to a string, this behavior will be performed only in cases where the first option's value matches the string. (Note that option values are strings even when digits--so a string of "0" could be used to target options with values of "0" and this will not be treated as `false`.) Default is `false`.