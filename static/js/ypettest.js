/**
 * A tester for YPet
 * To use this tester, load the script AFTER YPet is loaded (i.e. modifying the webpage to be loaded is needed). Then
 * in the console, type `YPetTest.start()` No messages will be printed if all tests are passed
 * E.g. add
 script(src="#{STATIC_URL}js/ypettest.js")
 * at the end of quest.jade
 *
 * @author Runjie Guan guanrunjie@gmail.com
 */

window.YPetTest = function() {

    var _ITERATIONS = 5;

    /**
     * A 2D word list. The words in the same array are in the same line
     * @type {Array}
     * @private
     */
    var _wordList = [],
        _invalidWordList = [];

    /**
     * Returns a random element given an array
     * @param list - an array of element
     * @param criteria - an optional function, return truthy to select the qualified random element
     * @returns a random element, or undefined if nothing meets the criteria after _ITERATION times
     * @private
     */
    function _randomElement(list, criteria) {
        "use strict";

        if (typeof list === "undefined" || !(list.length)) {
            return undefined;
        }

        if (typeof criteria !== "function") {
            criteria = function(elem) {
                return true;
            }
        }

        var j = 0;
        do {
            if (++j > _ITERATIONS) {
                elem = undefined;
                break;
            }
            var elem = list[parseInt(list.length * Math.random())];
        } while (!criteria(elem));

        return elem;
    }

    /**
     * Asserts if the passed in jquery element is the word that just got clicked
     * @param $elem
     * @private
     */
    function _assertSameWord($elem) {
        "use strict";

        console.assert(YPetTest.lastResponse.type_id === 0, `Word "${$elem.text()}" type_id is not zero`);
        console.assert($elem.text() === YPetTest.lastResponse.text, `Word "${$elem.text()}" doesn't match response`);
    };

    var _assertSameWords = function($leftElem, $rightElem) {
        "use strict";

        var texts = [];
        var $curr = $($leftElem);

        while ($curr.index() !== $rightElem.index()) {
            texts.push(_.str.clean($curr.text()));
            $curr = $curr.next();
        }

        texts.push($rightElem.text());
        texts = _sanitize(texts.join(" "));

        console.assert(YPetTest.lastResponse.type_id === 0, `Words "${texts}" type_id is not zero`);
        console.assert(texts === YPetTest.lastResponse.text, `Words "${texts}" doesn't match response, which is "${YPetTest.lastResponse.text}"`);
    };

    /**
     * Process the words and put them into _wordList for future reference.
     * Also process the invalid word
     * @private
     */
    function _processWords() {
        "use strict";

        _wordList = [];
        _invalidWordList = [];

        // Get the last instance of YPet
        var lastTop = -1,
            lastArray = undefined;
        $($(".paragraph").get($(".paragraph").length - 1)).find("span").each(function() {
            var top = $(this).offset().top;
            if (top !== lastTop) {
                _wordList.push(lastArray);

                lastTop = top;
                lastArray = [];
            }

            lastArray.push($(this));

            // Test if it's invalid
            if (!YPetTest.isValidWord($(this).text())) {
                _invalidWordList.push($(this));
            }
        });

        _wordList.push(lastArray);

        // Remove the first element cuz it's empty
        _wordList.shift();
    }

    /**
     * Tests the cycling of the type_id for words
     * @param $leftElem - the left element, or a single element to be tested
     * @param $rightElem (Optional) - the right element, or undefined
     * @private
     */
    function _testCycle($leftElem, $rightElem) {
        "use strict";

        if (typeof $rightElem === "undefined") {
            _testCycleForSingleWord($leftElem);
        } else {
            _testCycleForMultipleWords($leftElem, $rightElem);
        }
    }

    /**
     * Tests the cycling of the type_id for a single word
     * @param $elem - the element that has been already clicked once
     * @private
     */
    function _testCycleForSingleWord($elem) {
        "use strict";

        var response = YPetTest.lastResponse;

        // Only assert type_id and text
        // First click, change to green
        $elem.mousedown().mouseup();
        console.assert(YPetTest.lastResponse.type_id === 1, "On first cycle: type_id should be 1, got " + YPetTest.lastResponse.type_id);
        console.assert(YPetTest.lastResponse.text === response.text, `On first cycle: expect '${response.text}', got '${YPetTest.lastResponse.text}'. The element clicked is '${$elem.text()}'`);

        // Second click, change to red
        $elem.mousedown().mouseup();
        console.assert(YPetTest.lastResponse.type_id === 2, "On first cycle: type_id should be 2, got " + YPetTest.lastResponse.type_id);
        console.assert(YPetTest.lastResponse.text === response.text, `On second cycle: expect '${response.text}', got '${YPetTest.lastResponse.text}'. The element clicked is '${$elem.text()}'`);

        // // Last click, nothing should be updated
        // response = YPetTest.lastResponse;
        $elem.mousedown().mouseup();
        // console.assert(response == YPetTest.lastResponse, `On last cycle: response should not be changed. Expected:
        // ${response}. Got: ${YPetTest.lastResponse}. The element selected was "${$elem.text()}"`);
    }

    function _testCycleForMultipleWords($leftElem, $rightElem) {
        "use strict";

        // So that the expected number of elements to be iterated will be approx. equal to _ITERATIONS
        var threshold = _ITERATIONS / ($rightElem.index() - $leftElem.index());

        if (!isNaN(threshold) && threshold > 0) {
            // Create a new instance
            var $curr = $($leftElem);

            do {
                if (Math.random() < threshold) {
                    _testCycleForSingleWord($curr);
                    _simulateDragSelectWords($leftElem, $rightElem);
                }

                $curr = $curr.next();
            } while ($curr.index() !== $rightElem.index());
        }

        _testCycleForSingleWord($rightElem);
    };

    /**
     * To test click on a list of single valid word. A valid word is defined as a word that is not simply composed of
     * punctuations
     * @private
     */
    function _testClickOnValidWords() {
        "use strict";

        console.log("%cTest clicking on valid words...", "background:#000; color:#fff");

        for (var i = 0; i < _ITERATIONS; ++i) {
            var word = _randomElement(_randomElement(_wordList), (elem)=> {
                return YPetTest.isValidWord($(elem).text());
            });

            $(word).mousedown().mouseup();
            _assertSameWord($(word));
            _testCycle($(word));
        }
    };

    /**
     * Test clicing on invalid word. For the definition of invalid word, see YPetTest.isValidWord
     * @private
     */
    function _testClickOnInvalidWords() {
        "use strict";

        console.log("%cTest clicking on invalid words...", "background:#000; color:#fff");

        // Iterate each element instead of randomly choosing
        _.each(_invalidWordList, (word)=> {
            $(word).mousedown().mouseup();

            console.assert(YPetTest.lastResponse.type_id === 0, "On invalid word type_id: expect 0, got " + YPetTest.lastResponse.type_id);
            console.assert(YPetTest.lastResponse.text.length === 0, "On invalid word text: expect '', got " + YPetTest.lastResponse.text);
            console.assert(YPetTest.lastResponse.words.length === 0, "On invalid word words: expect empty, got " + YPetTest.lastResponse.words);
        });
    }

    function _testClickOnWords() {
        "use strict";

        _testClickOnValidWords();
        _testClickOnInvalidWords();
    }

    /**
     * Simulate dragging from `startElem` to `endElem`
     * @param startElem - the starting point of the word
     * @param endElem - the ending point
     * @private
     */
    function _simulateDragSelectWords(startElem, endElem) {
        $(startElem).mousedown();
        $(endElem).mouseover().mouseup();
    }

    /**
     * Drags and tests a selection of word. This function will test it in both ways (drag forward and backward)
     * @param $dragFrom - where the drag starts
     * @param $dragTo - where the drag ends
     * @param $assertFrom (Optional, default is $dragFrom) - where the selection is expected to start
     * @param $assertTo (Optional, default is $dragTo) - where the selection is expected to end
     * @private
     */
    function _dragAndTest($dragFrom, $dragTo, $assertFrom, $assertTo) {
        $assertFrom = $assertFrom || $dragFrom;
        $assertTo = $assertTo || $dragTo;

        if ($assertFrom.index() > $assertTo.index()) {
            var tmp = $assertFrom;
            $assertFrom = $assertTo;
            $assertTo = tmp;
        }

        // console.log(`$dragFrom: ${$dragFrom.index()}, $dragTo: ${$dragTo.index()}, $assertFrom:
        // ${$assertFrom.index()}, $assertTo: ${$assertTo.index()}`);

        // Drag forward
        console.log("   %cDragging forward", "background:#888; color:#fff");
        _simulateDragSelectWords($dragFrom, $dragTo);

        _assertSameWords($assertFrom, $assertTo);
        _testCycle($assertFrom, $assertTo);

        // Drag in opposite direction
        console.log("   %cDragging backward", "background:#888; color:#fff");
        _simulateDragSelectWords($dragTo, $dragFrom);

        _assertSameWords($assertFrom, $assertTo);
        _testCycle($assertFrom, $assertTo);
    }

    function _testDragSameLine() {
        "use strict";

        console.log("%cTest dragging the words in the same line ...", "background:#000; color:#fff");

        for (var i = 0; i < _ITERATIONS; ++i) {
            (()=> {
                var j = 0;
                var group = _randomElement(_wordList, (elem)=> {
                    return elem.length >= 2;
                });
                if (typeof group === "undefined") {
                    console.log("Unable to find a qualified line that contains multiple words");
                    return;
                }

                var leftElem = _randomElement(group, (elem) => {
                    return YPetTest.isValidWord($(elem).text());
                });
                if (typeof leftElem === "undefined") {
                    console.log("Unable to find a qualified word");
                    return;
                }

                var rightElem = _randomElement(group, (elem) => {
                    return YPetTest.isValidWord($(elem).text()) && $(elem).index() !== $(leftElem).index();
                });
                if (typeof group === "undefined") {
                    console.log("Unable to find a qualified word");
                    return;
                }

                // Make sure `leftElem` is on the left of `rightElem`
                if ($(leftElem).index() > $(rightElem).index()) {
                    var tmp = leftElem;
                    leftElem = rightElem;
                    rightElem = tmp;
                }

                leftElem = $(leftElem);
                rightElem = $(rightElem);

                _dragAndTest(leftElem, rightElem);
            })();
        }
    }

    function _testDragDifferentLine() {
        "use strict";

        console.log("%cTest dragging the words in the different lines ...", "background:#000; color:#fff");

        if (_wordList.length < 2) {
            console.log("The given passage does not have sufficient amount of lines");
            return;
        }

        for (var i = 0; i < _ITERATIONS; ++i) {
            (()=> {
                var leftElem = _randomElement(_randomElement(_wordList), (elem)=> {
                    return YPetTest.isValidWord($(elem).text());
                });
                if (typeof leftElem === "undefined") {
                    console.log("Unable to find a qualified word");
                    return;
                }

                var rightElem = _randomElement(_randomElement(_wordList), (elem) => {
                    return YPetTest.isValidWord($(elem).text()) && $(elem).offset().top !== $(leftElem).offset().top;
                });
                if (typeof rightElem === "undefined") {
                    console.log("Unable to find a qualified word");
                    return;
                }

                // Make sure `leftElem` is on the left of `rightElem`
                if ($(leftElem).index() > $(rightElem).index()) {
                    var tmp = leftElem;
                    leftElem = rightElem;
                    rightElem = tmp;
                }

                leftElem = $(leftElem);
                rightElem = $(rightElem);

                _dragAndTest(leftElem, rightElem);
            })();
        }
    }

    function _testDragInvalidWord() {
        "use strict";

        console.log("%cTest dragging the words from/to an invalid word ...", "background:#000; color:#fff");

        if (_wordList.length < 2) {
            console.log("The given passage does not have sufficient amount of lines");
            return;
        }

        for (var i = 0; i < _ITERATIONS; ++i) {
            (()=> {
                var validWord = _randomElement(_randomElement((_wordList), (elem) => {
                    return YPetTest.isValidWord($(elem).text());
                }));

                if (typeof validWord === "undefined") {
                    console.log("Unable to find a qualified word");
                    return;
                }

                var invalidWord = _randomElement(_invalidWordList, (elem)=> {
                    // Make sure this invalid word is not next to another invalid word
                    return ($(elem).index() > validWord.index()) ? YPetTest.isValidWord($(elem).prev().text()) : YPetTest.isValidWord($(elem).next().text());
                });

                // Adjust `invalidWord` to become a valid word
                if ($(validWord).index() > $(invalidWord).index()) {
                    // The invalid word is before valid word
                    var validNearInvalidWord = $(invalidWord).next();
                } else {
                    validNearInvalidWord = $(invalidWord).prev();
                }

                _dragAndTest(invalidWord, validWord, validWord, validNearInvalidWord);
            })();
        }
    }

    /**
     * Choose four difference words from a list, sorted by their index
     * ASSUMES that there are at least four words available to choose
     * @param list - The list to select, default value is _wordList
     * @returns {Array}
     * @private
     */
    function _selectFourUniqueValidWords(list) {
        list = list || _wordList;
        var candidates = [];

        for (var j = 0; j < 4; ++j) {
            ((j)=> {
                while (typeof candidates[j] === "undefined") {
                    candidates[j] = _randomElement(_randomElement(list), (elem)=> {
                        if (YPetTest.isValidWord($(elem).text())) {
                            for (var i = 0; i < j; ++i) {
                                if ($(elem).index() === $(candidates[i]).index()) {
                                    return false;
                                }
                            }
                            return true;
                        }

                        return false;
                    });
                }
            })(j);
        }

        // Sort the words based on their index
        candidates = candidates.sort((l, r)=> {
            return $(r).index() < $(l).index();
        });
        return candidates;
    }

    /**
     * Set a random type id to a word (or a selection of words) by clicking it 0, 1, or 2 times
     * @param $elem - the word to get random type id
     * @returns a type_id (# of times clicked)
     * @private
     */
    function _setRandomTypeID($elem) {
        // Randomly choose how many times this selection should be clicked
        var clicks = _randomElement([0, 1, 2]);
        for (var j = 0; j < clicks; ++j) {
            $($elem).mousedown().mouseup();
        }
        return clicks;
    }

    function _testDragOverSelectedWord() {
        "use strict";

        console.log("%cTest dragging over word selection", "background:#000; color:#fff");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the middle two words
            _simulateDragSelectWords(candidates[1], candidates[2]);
            _setRandomTypeID(candidates[1]);

            // Drag over the selection
            _dragAndTest(candidates[0], candidates[3]);
        }
    }

    function _testDragFromSelectedWord() {
        "use strict";

        console.log("%cTest dragging from word selection", "background:#000; color:#fff");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the first word and the third word
            _simulateDragSelectWords(candidates[0], candidates[2]);
            _setRandomTypeID(candidates[1]);

            // Drag from the selection
            _dragAndTest(candidates[1], candidates[3]);
        }
    }

    function _testDragToSelectedWord() {
        "use strict";

        console.log("%cTest dragging forward to word selection", "background:#000; color:#fff");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the second word and the last word
            _simulateDragSelectWords(candidates[1], candidates[3]);
            _setRandomTypeID(candidates[2]);

            // Drag to the selection
            _dragAndTest(candidates[0], candidates[2]);
        }
    }

    function _testDragValidWord() {
        _testDragSameLine();
        _testDragDifferentLine();
        _testDragOverSelectedWord();
        _testDragFromSelectedWord();
        _testDragToSelectedWord();
    }

    function _testDragOnWords() {
        "use strict";

        _testDragValidWord();
        _testDragInvalidWord();
    }

    /**
     * Test if SUBMIT button will submit the correct answer
     * How this works: First list everything to be tested, then choose the lines to be tested by shuffling
     * @private
     */
    function _testSubmitResults() {
        "use strict";

        console.log("%cTest submitting the results", "background:#000; color:#fff");

        var TYPE = {
                CLICK_INVALID: undefined,
                CLICK: 2,
                DRAG_FORWARD_DIFFERENT_LINE: 3,
                DRAG_BACKWARD_DIFFERENT_LINE: 4,
                DRAG_FORWARD_SAME_LINE: 5,
                DRAG_BACKWARD_SAME_LINE: 6,
                DRAG_OVER_SELECTED: 7,
                DRAG_TO_SELECTED: 8,
                DRAG_FROM_SELECTED: 9,
                DRAG_TO_INVALID: 100,
                DRAG_FROM_INVALID: 101
            },
            /**
             * The number of test cases above that need two lines (e.g. DRAG_FORWARD_DIFFERENT_LINE)
             */
            TWO_LINES = 2;

        // Make sure we have sufficient amount of lines to test all these
        var test_array = Object.keys(TYPE),
            len = _wordList.length - 1;

        // Get the values of TYPE
        for (var i = 0; i < test_array.length; ++i) {
            test_array[i] = TYPE[test_array[i]];
        }

        if (len < test_array.length + TWO_LINES) {
            console.log("The article doesn't have sufficient amount of lines to test submit results");
            return;
        }

        // Extend the test array
        test_array[len - TWO_LINES - 1] = test_array[len - TWO_LINES - 1] || undefined;
        var counter = 0;

        // Generate the test cases
        for (i = 0; i < len; ++i) {
            // Choose the randomized destination to swap
            var tar = parseInt(Math.random() * (len - i)) + i,
                tmp = test_array[i];
            test_array[i] = test_array[tar];
            test_array[tar] = tmp;
            if (test_array[i] == TYPE.DRAG_FROM_INVALID ||
                test_array[i] == TYPE.DRAG_TO_INVALID) {
                // Make sure there is an invalid word in this line
                for (var j = 0; j < _wordList[i].length; ++j) {
                    if (!YPetTest.isValidWord(_wordList[i][j].text())) {
                        break;
                    }
                }

                if (j === _wordList[i].length) {
                    // No invalid word is found, start this loop one more time
                    --i;
                    if (++counter == _ITERATIONS) {
                        // Unable to find an alternative test case for this line
                        console.log("Unable to create test cases for this article. Try again");
                        return;
                    }
                    continue;
                }
            } else if (test_array[i] == TYPE.DRAG_BACKWARD_DIFFERENT_LINE ||
                test_array[i] == TYPE.DRAG_FORWARD_DIFFERENT_LINE) {
                // The next line is skipped because these two test cases need two lines
                test_array.splice(++i, 0, undefined);
            }
            counter = 0;
        }

        /**
         * An array of expected words
         * @type {Array}
         */
        var expected = [],
            $elem,
            /**
             * Push an element in to expected, will also randmoized the type id
             * @param $elem
             */
            __pushToExpected = function($elem) {
                expected.push({
                    type_id: _setRandomTypeID($elem),
                    text: YPetTest.lastResponse.text
                });
            },
            invalidWordLength = 0;

        for (i = 0; i < len; ++i) {
            switch (test_array[i]) {
                case TYPE.CLICK:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    for (j = 0; j < 4; ++j) {
                        $($elem[j]).mousedown().mouseup();
                        __pushToExpected($elem[j]);
                    }
                    break;

                case TYPE.DRAG_FORWARD_DIFFERENT_LINE:
                    var $dragFrom = _randomElement(_wordList[i++], function($elem) {
                        return YPetTest.isValidWord($elem.text());
                    }), $dragTo = _randomElement(_wordList[i], function($elem) {
                        return YPetTest.isValidWord($elem.text());
                    });

                    _simulateDragSelectWords($dragFrom, $dragTo);
                    __pushToExpected($dragFrom);
                    break;

                case TYPE.DRAG_BACKWARD_DIFFERENT_LINE:
                    $dragTo = _randomElement(_wordList[i++], function($elem) {
                        return YPetTest.isValidWord($elem.text());
                    });
                    $dragFrom = _randomElement(_wordList[i], function($elem) {
                        return YPetTest.isValidWord($elem.text());
                    });

                    _simulateDragSelectWords($dragFrom, $dragTo);
                    __pushToExpected($dragFrom);
                    break;

                case TYPE.DRAG_FORWARD_SAME_LINE:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    _simulateDragSelectWords($elem[0], $elem[3]);
                    __pushToExpected($elem[1]);
                    break;

                case TYPE.DRAG_BACKWARD_SAME_LINE:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    _simulateDragSelectWords($elem[3], $elem[0]);
                    __pushToExpected($elem[1]);
                    break;

                case TYPE.DRAG_OVER_SELECTED:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    _simulateDragSelectWords($elem[1], $elem[2]);
                    _simulateDragSelectWords($elem[0], $elem[3]);

                    __pushToExpected($elem[2]);
                    break;

                case TYPE.DRAG_TO_SELECTED:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    _simulateDragSelectWords($elem[1], $elem[3]);
                    _simulateDragSelectWords($elem[0], $elem[2]);

                    __pushToExpected($elem[1]);
                    break;

                case TYPE.DRAG_FROM_SELECTED:
                    $elem = _selectFourUniqueValidWords(_wordList[i]);
                    _simulateDragSelectWords($elem[1], $elem[3]);
                    _simulateDragSelectWords($elem[2], $elem[0]);

                    __pushToExpected($elem[1]);
                    break;

                case TYPE.DRAG_TO_INVALID:
                    for (j = 0; j < _wordList[i].length; ++j) {
                        if (!YPetTest.isValidWord(_wordList[i][j].text())) {
                            var $invalid = _wordList[i][j];
                        }
                    }

                    $elem = _randomElement(_wordList[i], (elem) => {
                        return YPetTest.isValidWord(elem.text());
                    });

                    _simulateDragSelectWords($elem, $invalid);
                    __pushToExpected($elem);

                    break;

                case TYPE.DRAG_FROM_INVALID:
                    for (j = 0; j < _wordList[i].length; ++j) {
                        if (!YPetTest.isValidWord(_wordList[i][j].text())) {
                            $invalid = _wordList[i][j];
                        }
                    }

                    $elem = _randomElement(_wordList[i], (elem) => {
                        return YPetTest.isValidWord(elem.text());
                    });

                    _simulateDragSelectWords($invalid, $elem);
                    __pushToExpected($elem);

                    break;

                default:
                    // Click invalid words
                    for (j = 0; j < _wordList[i].length; ++j) {
                        if (!YPetTest.isValidWord(_wordList[i][j].text())) {
                            $(_wordList[i][j]).mousedown().mouseup();
                            ++invalidWordLength;
                        }
                    }
            }
        }

        // Verify expected against what's fetched
        var got = YPet.getView().getRegion(1).currentView.collection.parentDocument.get("annotations").toJSON();

        console.log("   %cVerifying word length", "background:#888; color:#fff");
        var invalidWords = _.where(got, {"text": ""});
        // console.assert(invalidWords.length === invalidWordLength, `Incorrect invalid word length. Expect ${invalidWordLength}, got ${invalidWords.length}`);

        got = _.difference(got, invalidWords);
        console.assert(got.length === expected.length, `Incorrect word length. Expect ${expected.length}, got ${got.length}`);

        console.log("   %cVerifying word content", "background:#888; color:#fff");
        got = _.map(got, (e)=> {
            return _.omit(e, ["words", "start"]);
        });
        console.assert(JSON.stringify(got) === JSON.stringify(expected), `Annotations don't match`);

    }

    /**
     * Sanitize the stirng to leave out unnecessary information
     * The function was modifed from YPet.js, AnnotationList.sanitizeAnnotation
     * @param full_str
     * @returns {string} sanitized string
     * @private
     */
    function _sanitize(full_str) {
        // todo try to use AnnotationList instead of creating a new function
        return _.str.clean(full_str).replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
    }

    return {
        lastResponse: {},
        start: function() {
            var regions = YPet.getView().getRegions();

            // For each region, add a new listener to listen to annotation change
            _.each(regions, (region) => {
                region.currentView.collection.parentDocument.get("annotations").on("change", (model) => {
                    "use strict";
                    YPetTest.lastResponse = model.toJSON();

                    var type = YPetTest.lastResponse.type_id;
                    // console.log("%c" + YPetTest.lastResponse.text.substr(0, 50), `font-size:6px;color:${type == 0 ?
                    //     "#d1f3ff" : (type == 1 ? "#B1FFA8" : "#ffd1dc")}`);
                });
            });

            // Then try to change it to see if I can capture it
            YPetTest.runTest();

            // Click submit to see if all the captured groups match
        },

        /**
         * Returns if current string is a valid string, i.e. is not empty after sanitizing
         * @param full_str - the string
         * @returns {boolean} true if this word is valid
         */
        isValidWord: function(full_str) {
            "use strict";
            return !!(_sanitize(full_str).length);
        },

        /**
         * The entrance to run the whole test suite
         */
        runTest: function() {
            "use strict";

            _processWords();

            _testClickOnWords();
            _testDragOnWords();

            _testSubmitResults();
        }
    }
}();