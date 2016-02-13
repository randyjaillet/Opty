/*

Opty is a searchable, easily-stylable replacement for select elements.

Specific custom markup is required. (It doesn't automatically inject in place of
or transform existing select elements).

As with real select elements, Optys can:
- be disabled with the "disabled" attribute
- have disabled options with the "disabled" attribute on options (which are spans)
- have default values with the "selected" attribute on options
- have multiple values with the "multiple" attribute. Opty handles this
more nicely though--users don't have to hold ctrl/cmd keys, and selections are
attractively represented both on the surface and within the menu
- have groups of options, the labels of which are not choosable

Optys store their values in "values" keys using jQuery's "data" method on the
.opty. Multiple-select Optys do so in an array of strings.

Terminology used in comments in this file:
- "surface" : The part of the Opty that is always visible. This is an A tag
so it is focusable and clickable/enter-able. It contains a copy of the text of the
selected option(s).
- "selected": An option has been chosen via click or enter and the value inserted
into the surface.
- "fake focus": A home-baked focus that is created/moved when the user uses the
arrow keys or home/end keys in the search field to navigate the menu sans mouse.
We don't want to use default tab behavior for this because that would require
the user's leaving the search field to navigate the list.
- "menu" or "dropdown": The sometimes-invisible part of the Opty containing
the list of options.
- "option": A choosable (unless it's not) list item in the Opty menu.
You know, like with real selects.

*/


/* This adds a case-insensitive version of jQuery's :contains selector, which
selects elements that contain text nodes containing the text entered as the
argument. This is for our menu search. */
jQuery.expr[':'].containsis = function(a, i, m) {
	return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

$(
	function(){


		$(".opty").each(
			function(){

				var $o = $(this);

				$o.data("shortMode", $(".list span", $o).length < 5);

				if ($o.data("shortMode")) {
					$(".search", $o).remove();
				}

				// Add support for the "selected" attribute to
				// allow for default selections.
				if ($o.has("[selected]").length) {
					chooseOption($o, $("[selected]",$o));
				} else {
					$o.addClass("zerostate");
				}

				$o.on(
					"disabled",
					function(e) {
						$(".surface", $o).attr("tabindex","-1");
					}
				).on(
					"reenabled",
					function(e) {
						$(".surface", $o).attr("tabindex","");
					}
				);

				// Add support for the "disabled" attribute.
				if ($(this).is("[disabled]")) {
					$(".surface", $o).attr("tabindex","-1").on(
						"click",
						function(e){
							e.preventDefault();
						}
					);
				} else {

					// Find a label for the Opty and make it so clicking
					// the label puts focus on this Opty's surface.
					var $thislabel = $('[for="' + $o.attr("id") + '"]');
					if ($thislabel.length) {
						$thislabel.on(
							"click",
							function(e){
								e.preventDefault();
								if (!$o.is("[disabled]")) {
									showMenu($o);
// 									$(".surface", $o).focus();
								}
							}
						);
					}

					// If the surface is clicked (or enter'd), show/hide the dropdown.
					$(".surface", this).on(
						"click",
						function(event) {
							event.preventDefault();

							if (!$o.is("[disabled]")) {
								if ($o.is(".activated")) {
									hideMenu($o, true);
								} else {
									showMenu($o);
								}
							}

						}
					);

					// If the user starts typing while the surface is selected but the
					// menu is not opened, we still want it to search as if focus is
					// in the text box. This mimics default select element behavior
					// which sort-of-searches when the user types focused on the select.
					$(".surface", this).on(
						"keypress",
						function(e) {
							if (!$o.is("[disabled]")) {
								$(".search",$o).val("").trigger("change");
								showMenu($o);
							}
						}
					);

					// Let's capture some keys in the search box...
					$(".search, .surface", this).on(
						"keydown",
						function(e) {
							var
								$thislist = $(".list", $o),
								$currentlyFocused = $(".fakefocus", $thislist),
								CFIndex = $("span", $thislist).index($currentlyFocused),
								$CFPrevAll = $("span", $thislist).slice(0,CFIndex),
								$CFPrevAllSelectable = $CFPrevAll.not(".hidden, [disabled]"),
								$CFNextAll = $("span", $thislist).slice(CFIndex+1),
								$CFNextAllSelectable = $CFNextAll.not(".hidden, [disabled]")
							;

							switch(e.which) {

								case 9: // Tab key
									if (!!$(".search", $o).val()) {
										chooseOption($o, $currentlyFocused, false);
									}
									hideMenu($o, true);
									break;

								case 38: // Up arrow key
									e.preventDefault(); // Don't move the cursor, only the fake focus

									showMenu($o);

									// If there is currently a fake focused option and it has a focusable
									// previous sibling, move fake focus to that previous sibling
									if ($currentlyFocused.length && $CFPrevAllSelectable.length) {
										$currentlyFocused.removeClass("fakefocus");
										var $targetOption = $CFPrevAllSelectable.last().addClass("fakefocus");
										scrollOptionIntoView($thislist, $targetOption);
									}
									break;

								case 40: // Down arrow key
									e.preventDefault(); // Don't move the cursor, only the fake focus

									showMenu($o);

									// If there is currently a fake focused option
									if ($currentlyFocused.length) {
									
										// If there is currently a focused option and it has a focusable
										// next sibling, move fake focus to that next sibling
										if ($currentlyFocused.length && $CFNextAllSelectable.length) {
											$currentlyFocused.removeClass("fakefocus");
											var $targetOption = $CFNextAllSelectable.first().addClass("fakefocus");
											scrollOptionIntoView($thislist, $targetOption);
										}
									} 

									// If there's no currently "fake focused" option,
									// fake focus on the first option in the list.
									else {
										$currentlyFocused.removeClass("fakefocus");
										var $targetOption = $thislist.find("span:not(.hidden, [disabled]):first").addClass("fakefocus");
										scrollOptionIntoView($thislist, $targetOption);
									}
									break;

								case 36: // Home key
									showMenu($o);

									// Move fake focus to the first option in the list
									$currentlyFocused.removeClass("fakefocus");
									var $targetOption = $thislist.find("span:not(.hidden, [disabled]):first").addClass("fakefocus");
									scrollOptionIntoView($thislist, $targetOption);
									break;

								case 35: // End key
									showMenu($o);

									// Move fake focus to the last option in the list
									$currentlyFocused.removeClass("fakefocus");
									var $targetOption = $thislist.find("span:not(.hidden, [disabled]):last").addClass("fakefocus");
									scrollOptionIntoView($thislist, $targetOption);
									break;

								case 27: // Esc key
									e.preventDefault(); // Don't un-maximize the window or whatever else esc might do
									hideMenu($o, true);
									break;

								case 8: // Backspace key
									if ((($(event.target).is(".search") && $(event.target).val() == "") || $(event.target).is(".surface")) && $o.is("[multiple]") && $(".surface .tag", $o).length) {
										e.preventDefault(); // Don't submit the form if we're in one
										unchooseOption($o, $(".surface .tag:last", $o).attr("data-value"));
									}
									break;

								case 13: // Enter key
									e.preventDefault(); // Don't submit the form if we're in one

									if ($o.hasClass("activated")) {
										// If something is fake focused...
										// (If nothing is, we don't care about enter key presses.)
										if ($(".fakefocus",$o).length) {

											// If the fake focused option is currently selected, do nothing
											// unless this is a multiple-select Opty, in which case we
											// unselect it.
											// (We're not allowing un-choosing in a single-select Opty.)
											if ($(".fakefocus",$o).hasClass("selected")) {
												if ($o.is("[multiple]")) {
													unchooseOption($o, $(".fakefocus",$o).attr("data-value"));
												}
											}

											// If the fake focused option is not currently selected,
											else {
												if ($o.is("[multiple]")) {
													chooseOption($o, $(".fakefocus",$o), false);
												} else {
													chooseOption($o, $(".fakefocus",$o), true);
												}
											}
										}
									} else {
										showMenu($o);
									}
									break;

							}

						}
					);

					// Any time the contents of the search box changes, search.
					$(".search", this).on(
						"input change",
						function(e) {
							searchMenu($o, $(this).val());
						}
					);

					$(".list span", this).on(
						"click",
						function(e) {
							if (!$o.is("[disabled]")) {
								// If the clicked option is selected and this is a
								// multiple-select Opty, unselect the option.
								// (We're not allowing un-choosing in a single-select Opty.)
								if ($(this).hasClass("selected")) {
									if ($o.is("[multiple]")) {
										unchooseOption($o, $(this).attr("data-value"));
									}
								} 

								// If the clicked option is not selected, select it
								// no matter what kind of Opty this is, as long
								// as the option isn't disabled.
								else {
									if (!$(this).is("[disabled]")) {
										chooseOption($o, $(this));
									}
								}
							}
						}
					);
				}


			}
		);

		// Whenever anything is clicked, close all the Optys except the one
		// that was clicked within if any were in fact clicked within.
		$(document).click(
			function(event){
				var $parentSelect = $(event.target).closest(".opty");
				var $parentLabelSelect = $("#" + $(event.target).closest("label").attr("for"));
				hideMenu($(".opty").not($parentSelect).not($parentLabelSelect));
			}
		);


	}
);


function showMenu($o) {
	hideMenu($(".opty").not($o)); // Close other menus.
	if (!$o.hasClass("activated")) {
		$o.addClass("activated");
	}
	if (!$o.data("shortMode")) {
		$(".search",$o).focus();
	}
}

function hideMenu($o, focusOnSurface) {
	if ($o.hasClass("activated")) {
		$o.removeClass("activated");
		window.setTimeout(
			function () {
				$o.closest(".field-row").removeClass("opty-activated");
			},
			300
		)
	}
	$(".fakefocus", $o).removeClass("fakefocus");
	if (focusOnSurface) {
		$(".surface", $o).focus();
	}
}

function searchMenu($o, string) {
	var $matches = $o.find("span:containsis(" + string + ")");
	
	// Unhide all options and groups for a clean slate.
	$(".hidden", $o).removeClass("hidden");

	// Hide options not matching the search
	$("span", $o).not($matches).addClass("hidden");

	// Hide groups with no options matching the search
	$("section", $o).filter(
		function(i,e) {
			if (!$("span:not(.hidden)", e).length) {
				return true;
			}
		}
	).addClass("hidden");

	// Un-fake-focus for a clean slate
	$("span.fakefocus", $o).removeClass("fakefocus");

	// If the user is actually focused on the search box,
	// fake focus on the first matching option.
	if ($(".search", $o).is(":focus")) {
		$("span:not(.hidden):first", $o).addClass("fakefocus");
	}
}

function chooseOption($o, $options, focusOnSurface) {
	$(".placeholder", $o).remove();

	// Multiple-select Optys
	if ($o.is("[multiple]")) {

		// If the Opty is multiple-select, we're storing the selected
		// values in a "values" array in jQuery's "data" method on the .opty.
		// If the values array doesn't exist yet for this Opty, create it.
		if (!$o.data("values"))
		{
			$o.data("values", []);
		}

		$options.each(
			function() {
				// Add the value of the selected option to the "values" array.
				$o.data("values").push($(this).attr("data-value"));

				// Create and inject a visible representation of the new
				// selection into the surface
				var $newtag = $("<a></a>")
						.addClass("tag")
						.attr("href","#")
						.attr("data-value", $(this).attr("data-value"))
						.attr("tabindex","-1")
						.text($(this).text())
						.appendTo($(".surface",$o))
						.on(
							"click",
							function(e){
								e.preventDefault();
								e.stopPropagation();
								unchooseOption($o, $(this).attr("data-value"));
							}
						)
				;

				$options.addClass("selected");
			}
		);
	}

	// Single-select Opty
	else {
		// Just in case multiple options slipped in, just use the last.
		var $option = $options.last();
		
		// For single-select Optys, the value is stored in a
		// string rather than an array. Stick the value in.
		$o.data("values", $option.attr("data-value"));

		// Put the text of the selected option into the surface.
		$(".surface", $o).text($option.text());

		// Move the selected class to the new option.
		$option.addClass("selected").siblings(".selected").removeClass("selected");

		hideMenu($o, focusOnSurface);
	}

	// If the search box has content entered, clear it.
	if ($(".search", $o).val()) {
		$(".search", $o).val("").trigger("change");
	}

	$o.trigger("change");
}

// This function is currently only used on multiple-select Optys, as
// single-select ones can't have their chosen options un-chosen (just
// like with real select elements.)
function unchooseOption($o, dataValue) {
	$('.tag[data-value="' + dataValue + '"]', $o).remove();
	$('span[data-value="' + dataValue + '"]', $o).removeClass("selected");
	$o.data("values").splice( $.inArray(dataValue, $o.data("values")), 1 );
	if ($(".search", $o).val()) {
		$(".search", $o).val("").trigger("change");
	}
}

// Sadly our fake focus doesn't move the scrollbar to keep it visible
// as with tabbing, so we must scroll the menu manually to keep our
// home-baked focus in view. (No, JavaScript's .scrollIntoView()
// doesn't quite give us what we want. It's a little too aggressive,
// scrolling the menu so the option is at the top even if no scrolling
// was necessary. It's more like "scrollToElementTopNoMatterWhat()".)
function scrollOptionIntoView($list, $option) {
	var topedgeoffset = $option.position().top;
	var bottomedgeoffset = $option.position().top + $option.outerHeight();

	if (topedgeoffset < $list.scrollTop()) {
		// The option is above the fold
		$list.scrollTop(topedgeoffset);
	} else if (bottomedgeoffset > $list.scrollTop() + $list.innerHeight()) {
		// The option is below the fold
		$list.scrollTop(bottomedgeoffset - $list.innerHeight());
	}
}