/* This adds a case-insensitive version of jQuery's :contains selector, which
selects elements that contain text nodes containing the text entered as the
argument. This is for our menu search. */
jQuery.expr[':'].containsis = function(a, i, m) {
	return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

$.fn.opti = function(options){

    var defaultOptions = {
	    shortModeThreshold : 5,
	    useFirstOptionAsPlaceholder : false
    };
    var settings = $.extend({}, defaultOptions, options);

    return this.each(
    	function() {


			$(this).find("select").addBack().each(
				function () {


					var
						$o = $('<div></div>')
								.addClass("opti")
								.attr("id", ($(this).attr("id") || "noid") + "-opti"),
						$oSurface = $('<a></a>')
								.attr("href", "#")
								.addClass("surface")
								.appendTo($o),
						$oDropdown = $('<div></div>')
								.addClass("dropdown")
								.appendTo($o),
						$oSearch = $('<input>')
								.attr("type", "text")
								.addClass("search")
								.attr("tabindex", -1)
								.appendTo($oDropdown),
						$oList = $('<section></section>')
								.addClass("list")
								.appendTo($oDropdown)
					;

					if ($(this).is("[disabled]")) {
						$o.attr("disabled", "disabled");
					}
					
					if ($(this).is("[multiple]")) {
						$o.attr("multiple", true);
					}

					if ($(this).is("[tabindex]")) {
						$o.attr("tabindex", $(this).attr("tabindex"));
					}

					var options = $(this).clone().html();

					var optionsManipulated = options
							.replace(/<optgroup/g,"<section")
							.replace(/<\/optgroup>/g, "</section>")
							.replace(/<option/g,"<span")
							.replace(/<\/option>/g, "</span>")
							.replace(/value=/g, "data-value=")
							.replace(/\n\s*/g, "")
							.replace(/ label="(.*?)"(.*?>)/g, "$2<h5>$1</h5>")
					;

					var $optionsParsed = $(optionsManipulated).appendTo($oList);
					
					if (settings.useFirstOptionAsPlaceholder) {
						var placeholderText = $oList.find("span").first().remove().text();
						$(".surface", $o).text(placeholderText);
					}

/*
					$options = $options.find("optgroup").addBack("optgroup").each(
						function (i,e) {
							var label = $(this).attr("label");
							$("<h5></h5>").text(label).prependTo($(this));
							$(this).children().unwrap().wrapAll("<section></section>");
						}
					).end().end();
*/

					$(this)
							.addClass("hidden")
							.after($o);

					$o.data("shortMode", $(".list span", $o).length < settings.shortModeThreshold);

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

						// Find a label for the Opti and make it so clicking
						// the label puts focus on this Opti's surface.
						var $thislabel = $('[for="' + $o.prev("select").attr("id") + '"]');
						if ($thislabel.length) {
							$thislabel.on(
								"click",
								function(e){
									e.preventDefault();
									if (!$o.is("[disabled]")) {
										showMenu($o);
									}
								}
							);
						}

						$(this).on(
							"focus",
							function () {
								$o.focus();
							}
						)

						// If the surface is clicked (or enter'd), show/hide the dropdown.
						$(".surface", $o).on(
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
						$(".surface", $o).on(
							"keypress",
							function(e) {
								if (!$o.is("[disabled]")) {
									$(".search",$o).val("").trigger("change");
									showMenu($o);
								}
							}
						);
	
						// Let's capture some keys in the search box...
						$(".search, .surface", $o).on(
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
												// unless this is a multiple-select Opti, in which case we
												// unselect it.
												// (We're not allowing un-choosing in a single-select Opti.)
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
						$(".search", $o).on(
							"input change",
							function(e) {
								searchMenu($o, $(this).val());
							}
						);
	
						$(".list span", $o).on(
							"click",
							function(e) {
								if (!$o.is("[disabled]")) {
									// If the clicked option is selected and this is a
									// multiple-select Opti, unselect the option.
									// (We're not allowing un-choosing in a single-select Opti.)
									if ($(this).hasClass("selected")) {
										if ($o.is("[multiple]")) {
											unchooseOption($o, $(this).attr("data-value"));
										}
									} 
	
									// If the clicked option is not selected, select it
									// no matter what kind of Opti this is, as long
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
			)


		}
	);

}

$(
	function () {
		// Whenever anything is clicked, close all the Optis except the one
		// that was clicked within if any were in fact clicked within.
		$(document).click(
			function(event){
				var $parentSelect = $(event.target).closest(".opti");
				var $parentLabelSelect = $("#" + $(event.target).closest("label").attr("for")).next(".opti");
				hideMenu($(".opti").not($parentSelect).not($parentLabelSelect));
			}
		);
	}
)

function showMenu($o) {
	hideMenu($(".opti").not($o)); // Close other menus.
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
				$o.closest(".field-row").removeClass("opti-activated");
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
	$o.removeClass("zerostate");
	$(".surface", $o).contents().filter(
		function(){
			return (this.nodeType == 3);
		}
	).remove();
	
	var $s = $o.prev("select");

	// Multiple-select Optis
	if ($o.is("[multiple]")) {

		$options.each(
			function(i,e) {
				// Add the value of the selected option to the original select.
				$s.val(
					function (index,value) {
						value ? value.push($(e).attr("data-value")) : value = [$(e).attr("data-value")];
 						return value;
					}
				);

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

	// Single-select Opti
	else {
		// Just in case multiple options slipped in, just use the last.
		var $option = $options.last();
		
		$s.val($option.attr("data-value"));

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

// This function is currently only used on multiple-select Optis, as
// single-select ones can't have their chosen options un-chosen (just
// like with real select elements.)
function unchooseOption($o, dataValue) {
		
	var $s = $o.prev("select");

	$('.tag[data-value="' + dataValue + '"]', $o).remove();
	$('span[data-value="' + dataValue + '"]', $o).removeClass("selected");
	$s.val(
		function (i, v) {
			v.splice( $.inArray(dataValue, v), 1 );
			return v;
		}
	)
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
function scrollOptionIntoView($list, $oon) {
	var topedgeoffset = $oon.position().top;
	var bottomedgeoffset = $oon.position().top + $oon.outerHeight();

	if (topedgeoffset < $list.scrollTop()) {
		// The option is above the fold
		$list.scrollTop(topedgeoffset);
	} else if (bottomedgeoffset > $list.scrollTop() + $list.innerHeight()) {
		// The option is below the fold
		$list.scrollTop(bottomedgeoffset - $list.innerHeight());
	}
}