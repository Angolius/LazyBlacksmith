var itemPriceLookup = (function ($, lb, Humanize) {
    "use strict";

    var sorting = [[1,1]];
    var regions = {};

    var options = {
        useIcons: false,
    }

    $.extend(lb.urls, {
        priceUrl: false,
        itemSearchUrl: false,
    });

    var resultRow = '<a href="#" data-id="@@ID@@" data-icon="@@ICON@@" data-name="@@NAME@@" class="list-group-item search-price">@@NAME@@</a>';
    var itemOldValue = "";
    var itemSearchBodyResult = '#resultList';

    /**
     * Search item function
     * @param string the name we want to search
     * @private
     */
    var _searchItem = function(name) {
        if(name == itemOldValue) {
            return false;
        }
        var url = lb.urls.itemSearchUrl;
        if(!url) {
            alert('Price URL has not been set.');
            return false;
        }

        // remove all problematic chars
        var nameEscaped = name.replace(/\//g, "")
                              .replace(/\\/g, "")
                              .replace(/`/g, "");

        if(nameEscaped.length < 3) {
            $(itemSearchBodyResult).html("");
            return false;
        }

        url = url.replace(/0000/, nameEscaped);

        // ajax call to get the blueprints
        $.getJSON(url, function(jsonData) {
            var htmlResult = "";
            var data = jsonData.result;

            // for each items in data
            for(var item in data) {
                var view = resultRow.replace(/@@ID@@/, data[item].id)
                                    .replace(/@@ICON@@/, data[item].icon)
                                    .replace(/@@NAME@@/g, data[item].name);
                htmlResult += view;
            }

            // display result
            if(htmlResult == "") {
                $(itemSearchBodyResult).html("");
            } else {
                $(itemSearchBodyResult).html(htmlResult);
            }

            // event on click to load item price
            $('.search-price').on('click', function() {
                // change active state
                $('.search-price').removeClass('active');
                $(this).addClass('active');

                // update headers and image
                $('#item-name').html($(this).attr('data-name'));
                if(options.useIcons) {
                    $('#item-icon').html("<img src='" + $(this).attr('data-icon') + "' alt='icon' />");
                }

                // get price
                _searchPrice($(this).attr('data-id'));
                return false;
            })

        })
        .error(function() {
            $(itemSearchBodyResult).html("");
        });
    };

    /**
     * Load the item price accross the regions
     * @param  the item_id to load
     * @private
     */
    var _searchPrice = function(item_id) {
        if(!$.isNumeric(item_id)) {
            return false;
        }
        var url = lb.urls.priceUrl.replace(/0000/, item_id);

        // get the prices
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(jsonPrice) {
                var prices = jsonPrice['prices'];
                var output = "";
                for(var regionId in prices) {
                    output += "<tr><td>" + regions[regionId] + "</td>";
                    output += "<td>" + Humanize.intcomma(prices[regionId][item_id].sell, 2) + "</td>";
                    output += "<td>" + Humanize.intcomma(prices[regionId][item_id].buy, 2) + "</td>";
                    output += "<td>" + prices[regionId][item_id].updated_at + "</td></tr>";
                }
                $('.price-list tbody').html(output);
                $(".price-list").trigger("update")
                $(".price-list").trigger("sorton",[sorting]);
            },
        });

    }

    /**
     * Runner function
     */
    var run = function() {
        var options = {
            callback: function (value) {
                _searchItem(value);
            },
            wait: 250,
            highlight: true,
            captureLength: 3
        }

        $('#itemSearch').typeWatch(options).on('keydown',
            function() {
                itemOldValue = $(this).val();
            }
        );

        // overwrite still to match ours
        $.tablesorter.themes.bootstrap = {
            table        : '',
            caption      : 'caption',
            header       : '',
            sortNone     : '',
            sortAsc      : '',
            sortDesc     : '',
            active       : '',
            hover        : '',
            icons        : '',
            iconSortNone : 'fa fa-sort',
            iconSortAsc  : 'fa fa-sort-asc',
            iconSortDesc : 'fa fa-sort-desc',
            filterRow    : '',
            footerRow    : '',
            footerCells  : '',
            even         : '',
            odd          : ''
        };


        $('.price-list').tablesorter({
            theme: "bootstrap",
            headerTemplate : '{content} {icon}',
            widgets : ["uitheme"],
        });
    };


    return {
        run: run,
        regions: regions,
        options: options,
    }

}) (jQuery, lb, Humanize);

lb.registerModule('itemPriceLookup', itemPriceLookup);