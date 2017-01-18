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
    var _randomElement = function(list, criteria) {
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
    };

    /**
     * Asserts if the passed in jquery element is the word that just got clicked
     * @param $elem
     * @private
     */
    var _assertSameWord = function($elem) {
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
        texts = texts.join(" ");

        console.assert(YPetTest.lastResponse.type_id === 0, `Words "${texts}" type_id is not zero`);
        console.assert(texts === YPetTest.lastResponse.text, `Words "${texts}" doesn't match response, which is "${YPetTest.lastResponse.text}"`);
    };

    /**
     * Process the words and put them into _wordList for future reference.
     * Also process the invalid word
     * @private
     */
    var _processWords = function() {
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
    };

    /**
     * Tests the cycling of the type_id for words
     * @param $leftElem - the left element, or a single element to be tested
     * @param $rightElem (Optional) - the right element, or undefined
     * @private
     */
    var _testCycle = function($leftElem, $rightElem) {
        "use strict";

        if (typeof $rightElem === "undefined") {
            _testCycleForSingleWord($leftElem);
        } else {
            _testCycleForMultipleWords($leftElem, $rightElem);
        }
    };

    /**
     * Tests the cycling of the type_id for a single word
     * @param $elem - the element that has been already clicked once
     * @private
     */
    var _testCycleForSingleWord = function($elem) {
        "use strict";

        var response = YPetTest.lastResponse;

        // Only assert type_id and text
        // First click, change to green
        $elem.mousedown().mouseup();
        console.assert(YPetTest.lastResponse.type_id === 1, "On first cycle: type_id should be 1, got " + YPetTest.lastResponse.type_id);
        console.assert(YPetTest.lastResponse.text === response.text, "On first cycle: expect '" + response.text + "', got '" + YPetTest.lastResponse.text + "'");

        // Second click, change to red
        $elem.mousedown().mouseup();
        console.assert(YPetTest.lastResponse.type_id === 2, "On first cycle: type_id should be 2, got " + YPetTest.lastResponse.type_id);
        console.assert(YPetTest.lastResponse.text === response.text, "On second cycle: expect '" + response.text + "', got '" + YPetTest.lastResponse.text + "'");

        // // Last click, nothing should be updated
        // response = YPetTest.lastResponse;
        $elem.mousedown().mouseup();
        // console.assert(response == YPetTest.lastResponse, `On last cycle: response should not be changed. Expected: ${response}. Got: ${YPetTest.lastResponse}. The element selected was "${$elem.text()}"`);
    };

    var _testCycleForMultipleWords = function($leftElem, $rightElem) {
        // todo find a random word in the list to cycle over to save some time
        "use strict";

        // Create a new instance
        // var $curr = $($leftElem);
        //
        // do {
        //     _testCycleForSingleWord($curr);
        //     _simulateDragSelectWords($leftElem, $rightElem);
        //     $curr = $curr.next();
        // } while ($curr.index() !== $rightElem.index());

        _testCycleForSingleWord($rightElem);
    };

    /**
     * To test click on a list of single valid word. A valid word is defined as a word that is not simply composed of
     * punctuations
     * @private
     */
    var _testClickOnValidWords = function() {
        "use strict";

        console.log("Test clicking on valid words...");

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
    var _testClickOnInvalidWords = function() {
        "use strict";

        console.log("Test clicking on invalid words...");

        // Iterate each element instead of randomly choosing
        _.each(_invalidWordList, (word)=> {
            $(word).mousedown().mouseup();

            console.assert(YPetTest.lastResponse.type_id === 0, "On invalid word type_id: expect 0, got " + YPetTest.lastResponse.type_id);
            console.assert(YPetTest.lastResponse.text.length === 0, "On invalid word text: expect '', got " + YPetTest.lastResponse.text);
            console.assert(YPetTest.lastResponse.words.length === 0, "On invalid word words: expect empty, got " + YPetTest.lastResponse.words);
        });
    };

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
        startElem.mousedown();
        endElem.mouseover().mouseup();
    }

    function _testDragForwardSameLine() {
        "use strict";

        console.log("Test dragging forward the words in the same line ...");

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
                _simulateDragSelectWords(leftElem, rightElem);

                _assertSameWords(leftElem, rightElem);
                _testCycle(leftElem, rightElem);
            })();
        }
    }

    function _testDragForwardDifferentLine() {
        "use strict";

        console.log("Test dragging forward the words in the different lines ...");

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
                _simulateDragSelectWords(leftElem, rightElem);

                _assertSameWords(leftElem, rightElem);
                _testCycle(leftElem, rightElem);
            })();
        }
    }

    function _testDragInvalidWord() {
        "use strict";

        console.log("Test dragging forward the words from/to an invalid word ...");

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

                // Drag from invalid word to a valid word
                _simulateDragSelectWords(invalidWord, validWord);
                _assertSameWords(validWord, validNearInvalidWord);
                _testCycle(validWord, validNearInvalidWord);

                // Drag from a valid word to an invalid word
                _simulateDragSelectWords(validWord, invalidWord);
                _assertSameWords(validWord, validNearInvalidWord);
                _testCycle(validWord, validNearInvalidWord);
            })();
        }
    }

    /**
     * Choose four difference words from _wordList, sorted by their index
     * ASSUMES that there are at least four words available to choose
     * @returns {Array}
     * @private
     */
    function _selectFourUniqueValidWords() {
        var candidates = [];

        for (var j = 0; j < 4; ++j) {
            ((j)=> {
                while (typeof candidates[j] === "undefined") {
                    candidates[j] = _randomElement(_randomElement(_wordList), (elem)=> {
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

    function _testDragForwardOverSelectedWord() {
        "use strict";

        console.log("Test dragging forward over word selection");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the middle two words
            _simulateDragSelectWords(candidates[1], candidates[2]);
            // Randomly choose how many times this selection should be clicked
            var clicks = _randomElement([0, 1, 2]);
            for (var j = 0; j < clicks; ++j) {
                candidates[1].mousedown().mouseup();
            }

            // Drag over the selection
            _simulateDragSelectWords(candidates[0], candidates[3]);
            _assertSameWords(candidates[0], candidates[3]);
            _testCycle(candidates[0], candidates[3]);
        }
    }

    function _testDragForwardFromSelectedWord() {
        "use strict";

        console.log("Test dragging forward from word selection");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the first word and the third word
            _simulateDragSelectWords(candidates[0], candidates[2]);
            // Randomly choose how many times this selection should be clicked
            var clicks = _randomElement([0, 1, 2]);
            for (var j = 0; j < clicks; ++j) {
                candidates[1].mousedown().mouseup();
            }

            // Drag from the selection
            _simulateDragSelectWords(candidates[1], candidates[3]);
            _assertSameWords(candidates[1], candidates[3]);
            _testCycle(candidates[1], candidates[3]);
        }
    }

    function _testDragForwardToSelectedWord() {
        "use strict";

        console.log("Test dragging forward to word selection");

        for (var i = 0; i < _ITERATIONS; ++i) {
            // Select four words
            var candidates = _selectFourUniqueValidWords();

            // Select the second word and the last word
            _simulateDragSelectWords(candidates[1], candidates[3]);
            // Randomly choose how many times this selection should be clicked
            var clicks = _randomElement([0, 1, 2]);
            for (var j = 0; j < clicks; ++j) {
                candidates[2].mousedown().mouseup();
            }

            // Drag to the selection
            _simulateDragSelectWords(candidates[0], candidates[2]);
            _assertSameWords(candidates[0], candidates[2]);
            _testCycle(candidates[0], candidates[2]);
        }
    }

    function _testDragForward() {
        _testDragForwardSameLine();
        _testDragForwardDifferentLine();
        _testDragForwardOverSelectedWord();
        _testDragForwardFromSelectedWord();
        _testDragForwardToSelectedWord();
    }

    function _testDragOnWords() {
        "use strict";

        _testDragForward();
        _testDragBackward();
        _testDragInvalidWord();
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
                });
            });

            // Then try to change it to see if I can capture it
            YPetTest.runTest();

            // Click submit to see if all the captured groups match
        },

        /**
         * Returns if current string is a valid string, i.e. is not empty after sanitizing
         * The function was modifed from YPet.js, AnnotationList.sanitizeAnnotation
         * @param full_str - the string
         * @returns {boolean} true if this word is valid
         */
        isValidWord: function(full_str) {
            "use strict";
            return !!(_.str.clean(full_str).replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '').length);
        },

        /**
         * The entrance to run the whole test suite
         */
        runTest: function() {
            "use strict";

            _processWords();

            _testClickOnWords();
            _testDragOnWords();
        }
    }
}();