var Razor;
(function (Razor) {
    var Environment = (function () {
        function Environment() {
        }
        Environment.NewLine = '\r\n';
        return Environment;
    })();
    Razor.Environment = Environment;
})(Razor || (Razor = {}));
/// <reference path="../Internals/Environment.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var ParserHelpers = (function () {
            function ParserHelpers() {
            }
            ParserHelpers.isBinaryDigit = function (value) {
                return (value === '0' || value === '1');
            };
            ParserHelpers.isOctalDigit = function (value) {
                return /[0-9]/.test(value);
            };
            ParserHelpers.isDecimalDigit = function (value) {
                return /[0-9]/.test(value);
            };
            ParserHelpers.isHexDigit = function (value) {
                return /[0-9a-fA-F]/.test(value);
            };
            ParserHelpers.isLetter = function (value) {
                return /[a-zA-Z]/.test(value);
            };
            ParserHelpers.isLetterOrDecimalDigit = function (value) {
                return ParserHelpers.isLetter(value) || ParserHelpers.isDecimalDigit(value);
            };
            ParserHelpers.isNewLine = function (value) {
                if (!!value) {
                    if (value.length == 1) {
                        return value === '\r' ||
                            value === '\n' ||
                            value === '\u0085' ||
                            value === '\u2028' ||
                            value === '\u2029';
                    }
                    return value === Razor.Environment.NewLine;
                }
                return false;
            };
            ParserHelpers.isWhiteSpace = function (value) {
                return value === ' ' ||
                    value === '\f' ||
                    value === '\t' ||
                    value === '\u000B';
            };
            ParserHelpers.isWhiteSpaceOrNewLine = function (value) {
                return ParserHelpers.isWhiteSpace(value) || ParserHelpers.isNewLine(value);
            };
            return ParserHelpers;
        })();
        Parser.ParserHelpers = ParserHelpers;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../Parser/ParserHelpers.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/Environment.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var ParserHelpers = Razor.Parser.ParserHelpers;
        var SourceLocationTracker = (function () {
            function SourceLocationTracker(currentLocationOrAbsoluteIndex, lineIndex, characterIndex) {
                if (arguments.length === 0) {
                    this._currentLocation = Razor.SourceLocation.Zero;
                }
                else if (currentLocationOrAbsoluteIndex instanceof Razor.SourceLocation) {
                    this._currentLocation = currentLocationOrAbsoluteIndex;
                }
                else {
                    this._currentLocation = new Razor.SourceLocation(currentLocationOrAbsoluteIndex, lineIndex, characterIndex);
                }
                this.updateInternalState();
            }
            Object.defineProperty(SourceLocationTracker.prototype, "currentLocation", {
                get: function () {
                    return this._currentLocation;
                },
                set: function (value) {
                    if (!!value) {
                        if (!value.equals(this.currentLocation)) {
                            this._currentLocation = value;
                            this.updateInternalState();
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            SourceLocationTracker.calculateNewLocation = function (lastPosition, newContent) {
                return new SourceLocationTracker(lastPosition).updateLocation(newContent).currentLocation;
            };
            SourceLocationTracker.prototype.recalculateSourceLocation = function () {
                this._currentLocation = new Razor.SourceLocation(this._absoluteIndex, this._lineIndex, this._characterIndex);
            };
            SourceLocationTracker.prototype.updateCharacterCore = function (characterRead, nextCharacter) {
                this._absoluteIndex++;
                if (Razor.Environment.NewLine.length === 1 && characterRead === Razor.Environment.NewLine ||
                    ParserHelpers.isNewLine(characterRead) && (characterRead !== '\r' || nextCharacter !== '\n')) {
                    this._lineIndex++;
                    this._characterIndex = 0;
                }
                else {
                    this._characterIndex++;
                }
            };
            SourceLocationTracker.prototype.updateInternalState = function () {
                this._absoluteIndex = this.currentLocation.absoluteIndex;
                this._lineIndex = this.currentLocation.lineIndex;
                this._characterIndex = this.currentLocation.characterIndex;
            };
            SourceLocationTracker.prototype.updateLocation = function (contentOrCharacterRead, nextCharacter) {
                if (!!nextCharacter) {
                    this.updateCharacterCore(contentOrCharacterRead, nextCharacter);
                }
                else {
                    var i = 0, l = contentOrCharacterRead.length;
                    for (; i < l; i++) {
                        nextCharacter = '\0';
                        if (i < (l - 1)) {
                            nextCharacter = contentOrCharacterRead[i + 1];
                        }
                        this.updateCharacterCore(contentOrCharacterRead[i], nextCharacter);
                    }
                }
                this.recalculateSourceLocation();
                return this;
            };
            return SourceLocationTracker;
        })();
        Text.SourceLocationTracker = SourceLocationTracker;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="Internals/IEquatable.ts" />
/// <reference path="Internals/IComparable.ts" />
/// <reference path="Text/SourceLocationTracker.ts" />
var Razor;
(function (Razor) {
    var SourceLocationTracker = Razor.Text.SourceLocationTracker;
    var SourceLocation = (function () {
        function SourceLocation(absoluteIndex, lineIndex, characterIndex) {
            this.absoluteIndex = absoluteIndex;
            this.lineIndex = lineIndex;
            this.characterIndex = characterIndex;
        }
        SourceLocation.add = function (left, right) {
            if (right.lineIndex > 0) {
                return new SourceLocation(left.absoluteIndex + right.absoluteIndex, left.lineIndex + right.lineIndex, right.characterIndex);
            }
            return new SourceLocation(left.absoluteIndex + right.absoluteIndex, left.lineIndex + right.lineIndex, left.characterIndex + right.characterIndex);
        };
        SourceLocation.advance = function (left, text) {
            var tracker = new SourceLocationTracker(left);
            tracker.updateLocation(text);
            return tracker.currentLocation;
        };
        SourceLocation.prototype.compareTo = function (other) {
            if (!other) {
                return -1;
            }
            return ((this.absoluteIndex < other.absoluteIndex) ? -1 : (this.absoluteIndex === other.absoluteIndex) ? 0 : 1);
        };
        SourceLocation.prototype.equals = function (other) {
            return this.compareTo(other) === 0;
        };
        SourceLocation.greaterThan = function (left, right) {
            return left.compareTo(right) > 0;
        };
        SourceLocation.lessThan = function (left, right) {
            return left.compareTo(right) < 0;
        };
        SourceLocation.subtract = function (left, right) {
            var characterIndex = (left.lineIndex != right.lineIndex) ? left.characterIndex : (left.characterIndex - right.characterIndex);
            return new SourceLocation(left.absoluteIndex - right.absoluteIndex, left.lineIndex - right.lineIndex, characterIndex);
        };
        SourceLocation.prototype.toString = function () {
            return ['(', this.absoluteIndex, ':', this.lineIndex, ',', this.characterIndex, ')'].join('');
        };
        SourceLocation.Undefined = new SourceLocation(-1, -1, -1);
        SourceLocation.Zero = new SourceLocation(0, 0, 0);
        return SourceLocation;
    })();
    Razor.SourceLocation = SourceLocation;
})(Razor || (Razor = {}));
/// <reference path="SourceLocation.ts" />
var Razor;
(function (Razor) {
    var RazorError = (function () {
        function RazorError(message, location, length) {
            this.message = message;
            this.location = location;
            this.length = length;
        }
        RazorError.prototype.equals = function (other) {
            if (!other) {
                return false;
            }
            return this.message === other.message &&
                this.location.equals(other.location) &&
                this.length === other.length;
        };
        return RazorError;
    })();
    Razor.RazorError = RazorError;
})(Razor || (Razor = {}));
/// <reference path="RazorError.ts" />
/// <reference path="SourceLocation.ts" />
var Razor;
(function (Razor) {
    var ErrorSink = (function () {
        function ErrorSink() {
            this._errors = [];
        }
        Object.defineProperty(ErrorSink.prototype, "errors", {
            get: function () {
                return this._errors;
            },
            enumerable: true,
            configurable: true
        });
        ErrorSink.prototype.onError = function (errorOrLocation, message, length) {
            var error;
            if (errorOrLocation instanceof Razor.RazorError) {
                error = errorOrLocation;
            }
            else {
                error = new Razor.RazorError(message, errorOrLocation, length);
            }
            this._errors.push(error);
        };
        return ErrorSink;
    })();
    Razor.ErrorSink = ErrorSink;
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            (function (SpanKind) {
                SpanKind[SpanKind["Transition"] = 0] = "Transition";
                SpanKind[SpanKind["MetaCode"] = 1] = "MetaCode";
                SpanKind[SpanKind["Comment"] = 2] = "Comment";
                SpanKind[SpanKind["Code"] = 3] = "Code";
                SpanKind[SpanKind["Markup"] = 4] = "Markup";
            })(SyntaxTree.SpanKind || (SyntaxTree.SpanKind = {}));
            var SpanKind = SyntaxTree.SpanKind;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../RazorError.ts" />
/// <reference path="../Internals/Environment.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var Environment = Razor.Environment;
        var StringBuilder = (function () {
            function StringBuilder(content) {
                if (!!content) {
                    this._buffer = content.split('');
                }
                else {
                    this._buffer = [];
                }
            }
            Object.defineProperty(StringBuilder.prototype, "length", {
                get: function () {
                    return this._buffer.length;
                },
                enumerable: true,
                configurable: true
            });
            StringBuilder.prototype.append = function (content, startIndexOrRepeat, count) {
                if (!!content && content.length > 1) {
                    this.appendCore(content, 0, content.length);
                }
                else if (!!count) {
                    this.appendCore(content, startIndexOrRepeat, count);
                }
                else if (!!startIndexOrRepeat) {
                    for (var i = 0; i < startIndexOrRepeat; i++) {
                        this.appendCore(content[0], 0, 1);
                    }
                }
                else if (!!content) {
                    this.appendCore(content[0], 0, 1);
                }
                return this;
            };
            StringBuilder.prototype.appendLine = function (content) {
                return this.append((content || '') + Environment.NewLine);
            };
            StringBuilder.prototype.appendCore = function (content, startIndex, count) {
                for (var i = startIndex; i < content.length && i < (startIndex + count); i++) {
                    this._buffer.push(content[i]);
                }
            };
            StringBuilder.prototype.charAt = function (index) {
                if (index >= this.length) {
                    throw "Index out of range: " + index;
                }
                return this._buffer[index];
            };
            StringBuilder.prototype.clear = function () {
                this._buffer = [];
            };
            StringBuilder.prototype.toString = function () {
                return this._buffer.join("");
            };
            return StringBuilder;
        })();
        Text.StringBuilder = StringBuilder;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../../Internals/IEquatable.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../Text/SourceLocationTracker.ts" />
/// <reference path="SyntaxTreeNode.ts" />
/// <reference path="SpanKind.ts" />
/// <reference path="Span.ts" />
/// <reference path="../../Tokenizer/Symbols/ISymbol.ts" />
/// <reference path="../../Text/StringBuilder.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var SourceLocationTracker = Razor.Text.SourceLocationTracker;
            var SpanBuilder = (function () {
                function SpanBuilder(original) {
                    this._symbols = [];
                    this._tracker = new SourceLocationTracker();
                    if (!!original) {
                        this.kind = original.kind;
                        this._symbols = original.symbols.slice(0);
                        this.start = original.start;
                    }
                    else {
                        this.reset();
                    }
                }
                Object.defineProperty(SpanBuilder.prototype, "symbols", {
                    get: function () {
                        return this._symbols;
                    },
                    enumerable: true,
                    configurable: true
                });
                SpanBuilder.prototype.accept = function (symbol) {
                    if (!symbol) {
                        return;
                    }
                    if (this._symbols.length === 0) {
                        this.start = symbol.start;
                        symbol.changeStart(Razor.SourceLocation.Zero);
                        this._tracker.currentLocation = Razor.SourceLocation.Zero;
                    }
                    else {
                        symbol.changeStart(this._tracker.currentLocation);
                    }
                    this._symbols.push(symbol);
                    this._tracker.updateLocation(symbol.content);
                };
                SpanBuilder.prototype.build = function () {
                    return new SyntaxTree.Span(this);
                };
                SpanBuilder.prototype.clearSymbols = function () {
                    this._symbols = [];
                };
                SpanBuilder.prototype.reset = function () {
                    this._symbols = [];
                    this.start = Razor.SourceLocation.Zero;
                };
                return SpanBuilder;
            })();
            SyntaxTree.SpanBuilder = SpanBuilder;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../../Internals/IEquatable.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../Text/SourceLocationTracker.ts" />
/// <reference path="SyntaxTreeNode.ts" />
/// <reference path="SpanKind.ts" />
/// <reference path="SpanBuilder.ts" />
/// <reference path="../../Tokenizer/Symbols/ISymbol.ts" />
/// <reference path="../../Text/StringBuilder.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var StringBuilder = Razor.Text.StringBuilder;
            var SourceLocationTracker = Razor.Text.SourceLocationTracker;
            var Span = (function (_super) {
                __extends(Span, _super);
                function Span(builder) {
                    _super.call(this);
                    this.replaceWith(builder);
                }
                Object.defineProperty(Span.prototype, "content", {
                    get: function () {
                        return this._content;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "isBlock", {
                    get: function () {
                        return false;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "kind", {
                    get: function () {
                        return this._kind;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "length", {
                    get: function () {
                        return this._content.length;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "next", {
                    get: function () {
                        return this._next || null;
                    },
                    set: function (value) {
                        this._next = value || null;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "previous", {
                    get: function () {
                        return this._previous || null;
                    },
                    set: function (value) {
                        this._previous = value || null;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "start", {
                    get: function () {
                        return this._start;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Span.prototype, "symbols", {
                    get: function () {
                        return this._symbols;
                    },
                    enumerable: true,
                    configurable: true
                });
                Span.prototype.accept = function (visitor) {
                    visitor.visitSpan(this);
                };
                Span.prototype.change = function (changes) {
                    var builder = new SyntaxTree.SpanBuilder(this);
                    changes(builder);
                    this.replaceWith(builder);
                };
                Span.prototype.changeStart = function (newStart) {
                    this._start = newStart;
                    var current = this;
                    var tracker = new SourceLocationTracker(newStart);
                    tracker.updateLocation(this.content);
                    while ((current = current.next) !== null) {
                        current._start = tracker.currentLocation;
                        tracker.updateLocation(current.content);
                    }
                };
                Span.prototype.equals = function (other) {
                    if (!other) {
                        return false;
                    }
                    var result = this.kind === other.kind &&
                        this.content === other.content;
                    if (result) {
                        if (this.symbols.length !== other.symbols.length) {
                            return false;
                        }
                        else {
                            for (var i = 0; i < this.symbols.length; i++) {
                                if (!this.symbols[i].equals(other.symbols[i])) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    }
                    return false;
                };
                Span.prototype.equivalentTo = function (node) {
                    var other;
                    if (node instanceof Span) {
                        other = node;
                        return this.kind === other.kind &&
                            this.start.equals(other.start) &&
                            this.content === other.content;
                    }
                    return false;
                };
                Span.getContent = function (symbols) {
                    var builder = new StringBuilder();
                    for (var i = 0; i < symbols.length; i++) {
                        builder.append(symbols[i].content);
                    }
                    return builder.toString();
                };
                Span.getGroupedSymbols = function (symbols) {
                    var group = {};
                    for (var i = 0; i < symbols.length; i++) {
                        var name = symbols[i].runtimeTypeName;
                        if (group.hasOwnProperty(name)) {
                            group[name] = group[name] + 1;
                        }
                        else {
                            group[name] = 1;
                        }
                    }
                    var builder = new StringBuilder();
                    for (var groupName in group) {
                        if (group.hasOwnProperty(groupName)) {
                            builder.append(groupName + ":" + group[groupName].toString() + ";");
                        }
                    }
                    return builder.toString();
                };
                Span.prototype.replaceWith = function (builder) {
                    this._kind = builder.kind;
                    this._symbols = builder.symbols;
                    this._start = builder.start;
                    builder.reset();
                    this._content = Span.getContent(this._symbols);
                    this._groupedSymbols = Span.getGroupedSymbols(this._symbols);
                };
                Span.prototype.setStart = function (newStart) {
                    this._start = newStart;
                };
                Span.prototype.toString = function () {
                    var builder = new StringBuilder();
                    builder.append(SyntaxTree.SpanKind[this.kind]);
                    builder.append("Span at " + this.start.toString() + "::" + this.length.toString() + " - [" + this.content + "]");
                    builder.append("{");
                    builder.append(this._groupedSymbols);
                    builder.append("}");
                    return builder.toString();
                };
                return Span;
            })(SyntaxTree.SyntaxTreeNode);
            SyntaxTree.Span = Span;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../RazorError.ts" />
/// <reference path="SyntaxTree/Block.ts" />
/// <reference path="SyntaxTree/Span.ts" />
/// <reference path="../ParserResults.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var ParserVisitor = (function () {
            function ParserVisitor() {
            }
            ParserVisitor.prototype.onComplete = function () {
            };
            ParserVisitor.prototype.visit = function (result) {
                result.document.accept(this);
                for (var i = 0; i < result.parserErrors.length; i++) {
                    this.visitError(result.parserErrors[i]);
                }
                this.onComplete();
            };
            ParserVisitor.prototype.visitBlock = function (block) {
                this.visitStartBlock(block);
                for (var i = 0; i < block.children.length; i++) {
                    block.children[i].accept(this);
                }
                this.visitEndBlock(block);
            };
            ParserVisitor.prototype.visitEndBlock = function (block) {
            };
            ParserVisitor.prototype.visitError = function (error) {
            };
            ParserVisitor.prototype.visitSpan = function (span) {
            };
            ParserVisitor.prototype.visitStartBlock = function (block) {
            };
            return ParserVisitor;
        })();
        Parser.ParserVisitor = ParserVisitor;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../../Internals/IEquatable.ts" />
/// <reference path="Block.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../ParserVisitor.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var SyntaxTreeNode = (function () {
                function SyntaxTreeNode() {
                }
                SyntaxTreeNode.prototype.accept = function (visitor) { };
                SyntaxTreeNode.prototype.equals = function (other) {
                    return false;
                };
                SyntaxTreeNode.prototype.equivalentTo = function (node) {
                    return false;
                };
                return SyntaxTreeNode;
            })();
            SyntaxTree.SyntaxTreeNode = SyntaxTreeNode;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            (function (BlockType) {
                BlockType[BlockType["Statement"] = 0] = "Statement";
                BlockType[BlockType["Directive"] = 1] = "Directive";
                BlockType[BlockType["Functions"] = 2] = "Functions";
                BlockType[BlockType["Expression"] = 3] = "Expression";
                BlockType[BlockType["Helper"] = 4] = "Helper";
                BlockType[BlockType["Markup"] = 5] = "Markup";
                BlockType[BlockType["Section"] = 6] = "Section";
                BlockType[BlockType["Template"] = 7] = "Template";
                BlockType[BlockType["Comment"] = 8] = "Comment";
                BlockType[BlockType["Tag"] = 9] = "Tag";
            })(SyntaxTree.BlockType || (SyntaxTree.BlockType = {}));
            var BlockType = SyntaxTree.BlockType;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="SyntaxTreeNode.ts" />
/// <reference path="BlockType.ts" />
/// <reference path="Block.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var BlockBuilder = (function () {
                function BlockBuilder(original) {
                    if (!original) {
                        this.reset();
                    }
                    else {
                        this.type = original.type;
                        this.children = original.children.slice(0);
                    }
                }
                Object.defineProperty(BlockBuilder.prototype, "children", {
                    get: function () {
                        return this._children;
                    },
                    enumerable: true,
                    configurable: true
                });
                BlockBuilder.prototype.build = function () {
                    return new SyntaxTree.Block(this);
                };
                BlockBuilder.prototype.reset = function () {
                    this.type = null;
                    this.children = [];
                };
                return BlockBuilder;
            })();
            SyntaxTree.BlockBuilder = BlockBuilder;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="IDisposable.ts" />
var Razor;
(function (Razor) {
    var DisposableAction = (function () {
        function DisposableAction(action, context) {
            this._action = action;
            this._context = context || null;
        }
        DisposableAction.prototype.dispose = function () {
            this._action.apply(this._context, []);
        };
        return DisposableAction;
    })();
    Razor.DisposableAction = DisposableAction;
})(Razor || (Razor = {}));
/// <reference path="../Internals/DisposableAction.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var LookaheadToken = (function (_super) {
            __extends(LookaheadToken, _super);
            function LookaheadToken(action, context) {
                _super.call(this, action, context);
                this._accepted = false;
            }
            LookaheadToken.prototype.accept = function () {
                this._accepted = true;
            };
            LookaheadToken.prototype.dispose = function () {
                if (!this._accepted) {
                    _super.prototype.dispose.call(this);
                }
            };
            return LookaheadToken;
        })(Razor.DisposableAction);
        Text.LookaheadToken = LookaheadToken;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../SourceLocation.ts" />
/// <reference path="ITextBuffer.ts" />
/// <reference path="LookaheadToken.ts" />
/// <reference path="ITextDocument.ts" />"
/// <reference path="ITextBuffer.ts" />
/// <reference path="../Internals/IEquatable.ts" />
/// <reference path="../Parser/SyntaxTree/Span.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var Span = Razor.Parser.SyntaxTree.Span;
        var TextChange = (function () {
            function TextChange(oldPosition, oldLength, oldBuffer, newPositionOrLength, newLengthOrBuffer, newBuffer) {
                var newPosition, newLength;
                if (arguments.length === 5) {
                    newBuffer = newLengthOrBuffer;
                    newLength = newPositionOrLength;
                    newPosition = oldPosition;
                }
                else {
                    newPosition = newPositionOrLength;
                    newLength = newLengthOrBuffer;
                }
                this._oldPosition = oldPosition;
                this._oldLength = oldLength;
                this._oldBuffer = oldBuffer;
                this._newPosition = newPosition;
                this._newLength = newLength;
                this._newBuffer = newBuffer;
            }
            Object.defineProperty(TextChange.prototype, "isDelete", {
                get: function () {
                    return this._oldLength > 0 && this._newLength === 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "isInsert", {
                get: function () {
                    return this._oldLength === 0 && this._newLength > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "isReplace", {
                get: function () {
                    return this._oldLength > 0 && this._newLength > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "newBuffer", {
                get: function () {
                    return this._newBuffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "newLength", {
                get: function () {
                    return this._newLength;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "newPosition", {
                get: function () {
                    return this._newPosition;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "newText", {
                get: function () {
                    if (!this._newText) {
                        this._newText = TextChange.getText(this._newBuffer, this._newPosition, this._newLength);
                    }
                    return this._newText;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "oldBuffer", {
                get: function () {
                    return this._oldBuffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "oldLength", {
                get: function () {
                    return this._oldLength;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "oldPosition", {
                get: function () {
                    return this._oldPosition;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextChange.prototype, "oldText", {
                get: function () {
                    if (!this._oldText) {
                        this._oldText = TextChange.getText(this._oldBuffer, this._oldPosition, this._oldLength);
                    }
                    return this._oldText;
                },
                enumerable: true,
                configurable: true
            });
            TextChange.prototype.applyChange = function (contentOrSpan, changeOffset) {
                var content, changeRelativePosition, prefix, suffix;
                if (contentOrSpan instanceof Span) {
                    content = contentOrSpan.content;
                    changeOffset = contentOrSpan.start.absoluteIndex;
                }
                else {
                    content = contentOrSpan;
                }
                changeRelativePosition = this.oldPosition - changeOffset;
                prefix = content.substr(0, changeRelativePosition);
                suffix = content.substr(changeRelativePosition + changeOffset);
                return [prefix, this.newText, suffix].join('');
            };
            TextChange.prototype.equals = function (other) {
                if (!!other) {
                    return this._oldPosition === other.oldPosition &&
                        this._oldLength === other.oldLength &&
                        this._newPosition === other.newPosition &&
                        this._newLength === other.newLength &&
                        this._oldBuffer === other.oldBuffer &&
                        this._newBuffer === other.newBuffer;
                }
                return false;
            };
            TextChange.getText = function (buffer, position, length) {
                var oldPosition, builder, i = 0, c;
                if (length === 0) {
                    return '';
                }
                oldPosition = buffer.position;
                try {
                    buffer.position = position;
                    if (length === 1) {
                        return buffer.read();
                    }
                    else {
                        builder = [];
                        for (; i < length; i++) {
                            c = buffer.read();
                            builder.push(c);
                        }
                        return builder.join('');
                    }
                }
                finally {
                    buffer.position = oldPosition;
                }
            };
            TextChange.prototype.normalize = function () {
                if (!!this._oldBuffer &&
                    this.isReplace &&
                    this._newLength > this._oldLength &&
                    this._newPosition === this._oldPosition &&
                    this.newText.indexOf(this.oldText) >= 0) {
                    return new TextChange(this.oldPosition + this.oldLength, 0, this.oldBuffer, this.oldPosition + this.oldLength, this.newLength - this.oldLength, this.newBuffer);
                }
                return this;
            };
            TextChange.prototype.toString = function () {
                return ['(', this.oldPosition, ':', this.oldLength, ' "', this.oldText, '") => (', this.newPosition, ':', this.newLength, ' \"', this.newText, '\")'].join('');
            };
            return TextChange;
        })();
        Text.TextChange = TextChange;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../../Internals/IEquatable.ts" />
/// <reference path="SyntaxTreeNode.ts" />
/// <reference path="BlockType.ts" />
/// <reference path="BlockBuilder.ts" />
/// <reference path="../../Tokenizer/Symbols/ISymbol.ts" />
/// <reference path="../../Text/StringBuilder.ts" />
/// <reference path="../../Text/TextChange.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var StringBuilder = Razor.Text.StringBuilder;
            var Block = (function (_super) {
                __extends(Block, _super);
                function Block(sourceOrType, contents) {
                    _super.call(this);
                    var type;
                    var source;
                    if (sourceOrType instanceof SyntaxTree.BlockBuilder) {
                        source = sourceOrType;
                        type = source.type;
                        contents = source.children;
                    }
                    else {
                        type = sourceOrType;
                    }
                    this._type = type;
                    this._children = contents;
                    for (var i = 0; i < this._children.length; i++) {
                        this._children[i].parent = this;
                    }
                }
                Object.defineProperty(Block.prototype, "children", {
                    get: function () {
                        return this._children;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Block.prototype, "isBlock", {
                    get: function () {
                        return true;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Block.prototype, "length", {
                    get: function () {
                        var len = 0;
                        for (var i = 0; i < this._children.length; i++) {
                            len += this._children[i].length;
                        }
                        return len;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Block.prototype, "start", {
                    get: function () {
                        if (this._children.length > 0) {
                            return this._children[0].start;
                        }
                        return Razor.SourceLocation.Zero;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Block.prototype, "type", {
                    get: function () {
                        return this._type;
                    },
                    enumerable: true,
                    configurable: true
                });
                Block.prototype.accept = function (visitor) {
                    visitor.visitBlock(this);
                };
                Block.prototype.equals = function (other) {
                    if (!other) {
                        return false;
                    }
                    if (!(other instanceof Block)) {
                        return false;
                    }
                    var result = this.type === other.type;
                    if (result) {
                        if (this.children.length !== other.children.length) {
                            return false;
                        }
                        else {
                            for (var i = 0; i < this.children.length; i++) {
                                if (!this.children[i].equals(other.children[i])) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    }
                    return false;
                };
                Block.prototype.equivalentTo = function (node) {
                    var other;
                    if (node instanceof Block) {
                        other = node;
                        var result = this.type === other.type;
                        if (result) {
                            if (this.children.length !== other.children.length) {
                                return false;
                            }
                            else {
                                for (var i = 0; i < this.children.length; i++) {
                                    if (!this.children[i].equivalentTo(other.children[i])) {
                                        return false;
                                    }
                                }
                                return true;
                            }
                        }
                        return false;
                    }
                    return false;
                };
                Block.prototype.findFirstDescendentSpan = function () {
                    var current = this;
                    while (current !== null && current.isBlock) {
                        var block = current;
                        if (block.children.length > 0) {
                            current = block.children[block.children.length - 1];
                        }
                        else {
                            current = null;
                        }
                    }
                    if (current !== null && !current.isBlock) {
                        return current;
                    }
                    return null;
                };
                Block.prototype.flatten = function () {
                    var result;
                    for (var i = 0; i < this.children.length; i++) {
                        var node = this.children[i];
                        if (node.isBlock) {
                            result = result.concat(node.flatten());
                        }
                        else {
                            result.push(node);
                        }
                    }
                    return result;
                };
                Block.prototype.locateOwner = function (change) {
                    var owner = null;
                    for (var i = 0; i < this.children.length; i++) {
                        var node = this.children[i], span = null;
                        if (node.isBlock) {
                            owner = node.locateOwner(change);
                        }
                        else {
                            span = node;
                            if (change.oldPosition < span.start.absoluteIndex) {
                                break;
                            }
                            owner = span;
                        }
                        if (owner !== null) {
                            break;
                        }
                    }
                    return owner;
                };
                Block.prototype.toString = function () {
                    var builder = new StringBuilder();
                    builder.append(SyntaxTree.BlockType[this._type]);
                    builder.append(" Block at ");
                    builder.append(this.start.toString());
                    builder.append("::");
                    builder.append(this.length.toString());
                    return builder.toString();
                };
                return Block;
            })(SyntaxTree.SyntaxTreeNode);
            SyntaxTree.Block = Block;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="Parser/SyntaxTree/Block.ts" />
/// <reference path="ErrorSink.ts" />
/// <reference path="RazorError.ts" />
var Razor;
(function (Razor) {
    var ParserResults = (function () {
        function ParserResults(document, tagHelperDescriptors, errorSink, success) {
            if (arguments.length > 3) {
                success = (errorSink.errors.length === 0);
            }
            this._success = success;
            this._document = document;
            this._errorSink = errorSink;
            this._tagHelperDescriptors = tagHelperDescriptors;
            this._prefix = null;
            if (tagHelperDescriptors && tagHelperDescriptors.length) {
                this._prefix = tagHelperDescriptors[0].prefix;
            }
        }
        Object.defineProperty(ParserResults.prototype, "document", {
            get: function () {
                return this._document;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParserResults.prototype, "errorSink", {
            get: function () {
                return this._errorSink;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParserResults.prototype, "parserErrors", {
            get: function () {
                return this._errorSink.errors;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParserResults.prototype, "prefix", {
            get: function () {
                return this._prefix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParserResults.prototype, "success", {
            get: function () {
                return this._success;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ParserResults.prototype, "tagHelperDescriptors", {
            get: function () {
                return this._tagHelperDescriptors;
            },
            enumerable: true,
            configurable: true
        });
        return ParserResults;
    })();
    Razor.ParserResults = ParserResults;
})(Razor || (Razor = {}));
/// <reference path="State.ts" />
var Razor;
(function (Razor) {
    var StateResult = (function () {
        function StateResult(nextOrOutput, next) {
            if (typeof nextOrOutput === "function") {
                this.next = nextOrOutput;
                this.hasOutput = false;
                this.output = null;
            }
            else {
                this.next = next;
                this.hasOutput = true;
                this.output = nextOrOutput;
            }
        }
        return StateResult;
    })();
    Razor.StateResult = StateResult;
})(Razor || (Razor = {}));
/// <reference path="StateResult.ts" />
/// <reference path="State.ts" />
/// <reference path="StateResult.ts" />
var Razor;
(function (Razor) {
    var StateMachine = (function () {
        function StateMachine() {
        }
        StateMachine.prototype.stay = function (output) {
            return (arguments.length)
                ? new Razor.StateResult(output, this.currentState)
                : new Razor.StateResult(this.currentState);
        };
        StateMachine.prototype.stop = function () {
            return null;
        };
        StateMachine.prototype.transition = function (outputOrNewState, newState) {
            return new Razor.StateResult(outputOrNewState, newState);
        };
        StateMachine.prototype.turn = function () {
            if (!!this.currentState) {
                var result;
                do {
                    result = this.currentState();
                    this.currentState = result.next;
                } while (!!result && !result.hasOutput);
                if (!result) {
                    return null;
                }
                return result.output;
            }
            return null;
        };
        return StateMachine;
    })();
    Razor.StateMachine = StateMachine;
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Tuple = (function () {
        function Tuple(item1, item2) {
            this.item1 = item1;
        }
        return Tuple;
    })();
    Razor.Tuple = Tuple;
})(Razor || (Razor = {}));
/// <reference path="IDisposable.ts" />"
var Razor;
(function (Razor) {
    function Using(contextOrDisposable, disposableOrAction, action) {
        if (arguments.length === 2) {
            action = disposableOrAction;
            disposableOrAction = contextOrDisposable;
            contextOrDisposable = null;
        }
        try {
            action.apply(contextOrDisposable, [disposableOrAction]);
        }
        finally {
            disposableOrAction.dispose();
        }
    }
    Razor.Using = Using;
})(Razor || (Razor = {}));
/// <reference path="SyntaxTree/Block.ts" />
/// <reference path="../ErrorSink.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var RewritingContext = (function () {
            function RewritingContext(syntaxTree, errorSink) {
                this.syntaxTree = syntaxTree;
                this._errors = [];
                this._errorSink = errorSink;
            }
            Object.defineProperty(RewritingContext.prototype, "errorSink", {
                get: function () {
                    return this._errorSink;
                },
                enumerable: true,
                configurable: true
            });
            return RewritingContext;
        })();
        Parser.RewritingContext = RewritingContext;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="RewritingContext.ts" />
/// <reference path="../SourceLocation.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var LocationTagged = (function () {
            function LocationTagged(value, locationOrOffset, line, col) {
                this._location = Razor.SourceLocation.Undefined;
                this._value = null;
                this._value = value;
                if (locationOrOffset instanceof Razor.SourceLocation) {
                    this._location = locationOrOffset;
                }
                else {
                    this._location = new Razor.SourceLocation(locationOrOffset, line, col);
                }
            }
            Object.defineProperty(LocationTagged.prototype, "location", {
                get: function () {
                    return this._location;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LocationTagged.prototype, "value", {
                get: function () {
                    return this._value;
                },
                enumerable: true,
                configurable: true
            });
            LocationTagged.prototype.equals = function (other) {
                if (!!other) {
                    if (this === other) {
                        return true;
                    }
                    return this.location.equals(other.location) &&
                        (this.value === other.value);
                }
                return false;
            };
            LocationTagged.prototype.toString = function () {
                return (this.value || "").toString();
            };
            LocationTagged.prototype.toFormattedString = function () {
                return [this.toString(), '@', this.location.toString()].join('');
            };
            return LocationTagged;
        })();
        Text.LocationTagged = LocationTagged;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="ISymbol.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../RazorError.ts" />
/// <reference path="../../Text/LocationTagged.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            var LocationTagged = Razor.Text.LocationTagged;
            var SymbolBase = (function () {
                function SymbolBase(start, content, type, errors) {
                    this.start = start;
                    this.content = content;
                    this.type = type;
                    this.errors = errors;
                }
                Object.defineProperty(SymbolBase.prototype, "runtimeTypeName", {
                    get: function () {
                        return "SymbolBase";
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SymbolBase.prototype, "typeName", {
                    get: function () {
                        return this.type.toString();
                    },
                    enumerable: true,
                    configurable: true
                });
                SymbolBase.prototype.changeStart = function (newStart) {
                    this.start = newStart;
                };
                SymbolBase.prototype.getContent = function () {
                    return new LocationTagged(this.content, this.start);
                };
                SymbolBase.prototype.equals = function (other) {
                    if (!other) {
                        return false;
                    }
                    return this.start.equals(other.start) &&
                        this.content === other.content &&
                        this.type === other.type;
                };
                SymbolBase.prototype.offsetStart = function (documentStart) {
                    this.start = Razor.SourceLocation.add(documentStart, this.start);
                };
                SymbolBase.prototype.toString = function () {
                    return [this.start.toString(), ' ', this.typeName, ' - ', this.content].join('');
                };
                return SymbolBase;
            })();
            Symbols.SymbolBase = SymbolBase;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            (function (KnownSymbolType) {
                KnownSymbolType[KnownSymbolType["WhiteSpace"] = 0] = "WhiteSpace";
                KnownSymbolType[KnownSymbolType["NewLine"] = 1] = "NewLine";
                KnownSymbolType[KnownSymbolType["Identifier"] = 2] = "Identifier";
                KnownSymbolType[KnownSymbolType["Keyword"] = 3] = "Keyword";
                KnownSymbolType[KnownSymbolType["Transition"] = 4] = "Transition";
                KnownSymbolType[KnownSymbolType["Unknown"] = 5] = "Unknown";
                KnownSymbolType[KnownSymbolType["CommentStart"] = 6] = "CommentStart";
                KnownSymbolType[KnownSymbolType["CommentStar"] = 7] = "CommentStar";
                KnownSymbolType[KnownSymbolType["CommentBody"] = 8] = "CommentBody";
            })(Symbols.KnownSymbolType || (Symbols.KnownSymbolType = {}));
            var KnownSymbolType = Symbols.KnownSymbolType;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="../Internals/IDisposable.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var EOF = -1;
        var TextReader = (function () {
            function TextReader() {
            }
            TextReader.prototype.dispose = function () {
            };
            TextReader.prototype.peek = function () {
                return EOF;
            };
            TextReader.prototype.read = function (buffer, index, count) {
                if (arguments.length === 3) {
                    var n = 0, ch;
                    do {
                        ch = this.read();
                        if (ch === EOF) {
                            break;
                        }
                        buffer[index + n++] = ch;
                    } while (n < count);
                    return n;
                }
                return EOF;
            };
            TextReader.prototype.readBlock = function (buffer, index, count) {
                var i, n = 0;
                do {
                    n += (i = this.read(buffer, index + n, count - n));
                } while (i > 0 && n < count);
                return n;
            };
            TextReader.prototype.readLine = function () {
                var buffer = [], ch;
                while (true) {
                    ch = this.read();
                    if (ch === EOF) {
                        break;
                    }
                    if (ch === '\r' || ch === '\n') {
                        if (ch === '\r' && this.peek() === '\n') {
                            this.read();
                        }
                        return buffer.join('');
                    }
                    buffer.push(ch);
                }
                if (buffer.length) {
                    return buffer.join('');
                }
                return null;
            };
            TextReader.prototype.readToEnd = function () {
                var size = 4096;
                var buffer = (new Array(size)), len, res = [];
                while ((len = this.read(buffer, 0, size)) !== 0) {
                    res = res.concat(buffer.slice(0, len));
                }
                return res.join('');
            };
            return TextReader;
        })();
        Text.TextReader = TextReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../SourceLocation.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var CharacterReference = (function () {
            function CharacterReference(character, location) {
                this._char = character;
                this._loc = location;
            }
            Object.defineProperty(CharacterReference.prototype, "character", {
                get: function () {
                    return this._char;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(CharacterReference.prototype, "location", {
                get: function () {
                    return this._loc;
                },
                enumerable: true,
                configurable: true
            });
            return CharacterReference;
        })();
        Text.CharacterReference = CharacterReference;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var TextLine = (function () {
            function TextLine(start, index, content) {
                this.start = start;
                this.index = index;
                this.content = content;
                if (!content) {
                    this.content = '';
                }
            }
            Object.defineProperty(TextLine.prototype, "end", {
                get: function () {
                    return this.start + this.length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextLine.prototype, "length", {
                get: function () {
                    return this.content.length;
                },
                enumerable: true,
                configurable: true
            });
            TextLine.prototype.contains = function (index) {
                return index < this.end && index >= this.start;
            };
            return TextLine;
        })();
        Text.TextLine = TextLine;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="CharacterReference.ts" />
/// <reference path="TextLine.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Parser/ParserHelpers.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var ParserHelpers = Razor.Parser.ParserHelpers;
        var LineTrackingStringBuffer = (function () {
            function LineTrackingStringBuffer() {
                this._endLine = new Text.TextLine(0, 0);
                this._lines = [this._endLine];
            }
            Object.defineProperty(LineTrackingStringBuffer.prototype, "endLocation", {
                get: function () {
                    return new Razor.SourceLocation(this.length, this._lines.length - 1, this._lines[this._lines.length - 1].length);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(LineTrackingStringBuffer.prototype, "length", {
                get: function () {
                    return this._endLine.end;
                },
                enumerable: true,
                configurable: true
            });
            LineTrackingStringBuffer.prototype.append = function (content) {
                if (content === null) {
                    return;
                }
                for (var i = 0; i < content.length; i++) {
                    this._lines[this._lines.length - 1].content += content[i];
                    if ((content[i] === '\r' && (i + 1 === content.length || content[i + 1] !== '\n')) || (content[i] !== '\r' && ParserHelpers.isNewLine(content[i]))) {
                        this.pushNewLine();
                    }
                }
            };
            LineTrackingStringBuffer.prototype.charAt = function (absoluteIndex) {
                var line = this.findLine(absoluteIndex);
                if (line === null) {
                    throw "Argument out of range: " + absoluteIndex;
                }
                var idx = absoluteIndex - line.start;
                return new Text.CharacterReference(line.content[idx], new Razor.SourceLocation(absoluteIndex, line.index, idx));
            };
            LineTrackingStringBuffer.prototype.findLine = function (absoluteIndex) {
                var selected = null;
                if (this._currentLine != null) {
                    if (this._currentLine.contains(absoluteIndex)) {
                        selected = this._currentLine;
                    }
                    else if (absoluteIndex > this._currentLine.index && this._currentLine.index + 1 < this._lines.length) {
                        selected = this.scanLines(absoluteIndex, this._currentLine.index);
                    }
                }
                if (selected === null) {
                    selected = this.scanLines(absoluteIndex, 0);
                }
                this._currentLine = selected;
                return selected;
            };
            LineTrackingStringBuffer.prototype.scanLines = function (absoluteIndex, start) {
                for (var i = 0; i < this._lines.length; i++) {
                    var idx = (i + start) % this._lines.length;
                    if (this._lines[idx].contains(absoluteIndex)) {
                        return this._lines[idx];
                    }
                }
                return null;
            };
            LineTrackingStringBuffer.prototype.pushNewLine = function () {
                this._endLine = new Text.TextLine(this._endLine.end, this._endLine.index + 1);
                this._lines.push(this._endLine);
            };
            return LineTrackingStringBuffer;
        })();
        Text.LineTrackingStringBuffer = LineTrackingStringBuffer;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="TextReader.ts" />
/// <reference path="ITextBuffer.ts" />
/// <reference path="ITextDocument.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="LineTrackingStringBuffer.ts" />
/// <reference path="CharacterReference.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var EOF = -1;
        var SeekableTextReader = (function (_super) {
            __extends(SeekableTextReader, _super);
            function SeekableTextReader(content) {
                _super.call(this);
                this._position = 0;
                this._buffer = new Text.LineTrackingStringBuffer();
                this._location = Razor.SourceLocation.Zero;
                if (content instanceof Text.TextReader) {
                    content = content.readToEnd();
                }
                else if (typeof content === "object") {
                    content = content.readToEnd();
                }
                this._buffer.append(content);
                this.updateState();
            }
            Object.defineProperty(SeekableTextReader.prototype, "buffer", {
                get: function () {
                    return this._buffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SeekableTextReader.prototype, "location", {
                get: function () {
                    return this._location;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SeekableTextReader.prototype, "length", {
                get: function () {
                    return this._buffer.length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SeekableTextReader.prototype, "position", {
                get: function () {
                    return this._position;
                },
                set: function (value) {
                    if (this._position !== value) {
                        this._position = value;
                        this.updateState();
                    }
                },
                enumerable: true,
                configurable: true
            });
            SeekableTextReader.prototype.beginLookahead = function () {
                var _this = this;
                var start = this.position;
                return new Text.LookaheadToken(function () { return _this.position = start; });
            };
            SeekableTextReader.prototype.peek = function () {
                if (!this._current) {
                    return EOF;
                }
                return this._current;
            };
            SeekableTextReader.prototype.read = function (buffer, index, count) {
                if (arguments.length === 3) {
                    return _super.prototype.read.call(this, buffer, index, count);
                }
                if (!this._current) {
                    return EOF;
                }
                var chr = this._current;
                this._position++;
                this.updateState();
                return chr;
            };
            SeekableTextReader.prototype.seek = function (count) {
                this.position += count;
            };
            SeekableTextReader.prototype.updateState = function () {
                if (this._position < this._buffer.length) {
                    var ref = this._buffer.charAt(this._position);
                    this._current = ref.character;
                    this._location = ref.location;
                }
                else if (this._buffer.length === 0) {
                    this._current = null;
                    this._location = Razor.SourceLocation.Zero;
                }
                else {
                    this._current = null;
                    this._location = this._buffer.endLocation;
                }
            };
            SeekableTextReader.prototype.toDocument = function () {
                return this;
            };
            return SeekableTextReader;
        })(Text.TextReader);
        Text.SeekableTextReader = SeekableTextReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../Tokenizer/Symbols/ISymbol.ts" />
/// <reference path="../Tokenizer/Symbols/SymbolBase.ts" />
/// <reference path="../Tokenizer/Symbols/KnownSymbolType.ts" />
/// <referemce path="../Tokenizer/Tokenizer.ts" />
/// <referemce path="../Tokenizer/ITokenizer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/SeekableTextReader.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/Using.ts" />
/// <reference path="../Internals/Tuple.ts" />
/// <reference path="../RazorError.ts" />
/// <reference path="../Text/SourceLocationTracker.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var KnownSymbolType = Razor.Tokenizer.Symbols.KnownSymbolType;
        var SeekableTextReader = Razor.Text.SeekableTextReader;
        var SourceLocationTracker = Razor.Text.SourceLocationTracker;
        var using = Razor.Using;
        var Tuple = Razor.Tuple;
        var LanguageCharacteristics = (function () {
            function LanguageCharacteristics() {
            }
            LanguageCharacteristics.prototype.createMarkerSymbol = function (location) {
                return null;
            };
            LanguageCharacteristics.prototype.createSymbol = function (location, content, type, errors) {
                return null;
            };
            LanguageCharacteristics.prototype.createTokenizer = function (source) {
                return null;
            };
            LanguageCharacteristics.prototype.flipBracket = function (bracket) {
                return null;
            };
            LanguageCharacteristics.prototype.getKnownSymbolType = function (type) {
                return null;
            };
            LanguageCharacteristics.prototype.getSample = function (type) {
                return null;
            };
            LanguageCharacteristics.prototype.isCommentBody = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.CommentBody);
            };
            LanguageCharacteristics.prototype.isCommentStar = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.CommentStar);
            };
            LanguageCharacteristics.prototype.isCommentStart = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.CommentStart);
            };
            LanguageCharacteristics.prototype.isIdentifier = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.Identifier);
            };
            LanguageCharacteristics.prototype.isKeyword = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.Keyword);
            };
            LanguageCharacteristics.prototype.isKnownSymbolType = function (symbol, type) {
                return !!symbol && (symbol.type === this.getKnownSymbolType(type));
            };
            LanguageCharacteristics.prototype.isNewLine = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.NewLine);
            };
            LanguageCharacteristics.prototype.isTransition = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.Transition);
            };
            LanguageCharacteristics.prototype.isUnknown = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.Unknown);
            };
            LanguageCharacteristics.prototype.isWhiteSpace = function (symbol) {
                return this.isKnownSymbolType(symbol, KnownSymbolType.WhiteSpace);
            };
            LanguageCharacteristics.prototype.knowsSymbolType = function (type) {
                return type === KnownSymbolType.Unknown || (this.getKnownSymbolType(type) === this.getKnownSymbolType(KnownSymbolType.Unknown));
            };
            LanguageCharacteristics.prototype.splitSymbol = function (symbol, splitAt, leftType) {
                var left = this.createSymbol(symbol.start, symbol.content.substr(0, splitAt), leftType, []);
                var right = null;
                if (splitAt < symbol.content.length) {
                    right = this.createSymbol(SourceLocationTracker.calculateNewLocation(symbol.start, left.content), symbol.content.substr(splitAt), symbol.type, symbol.errors);
                }
                return new Tuple(left, right);
            };
            LanguageCharacteristics.prototype.tokenizeString = function (startOrInput, input) {
                var _this = this;
                var start;
                if (startOrInput instanceof Razor.SourceLocation) {
                    start = startOrInput;
                }
                else {
                    input = startOrInput;
                    start = Razor.SourceLocation.Zero;
                }
                var results = [];
                var reader = new SeekableTextReader(input);
                using(reader, function () {
                    var tok = _this.createTokenizer(reader);
                    var sym;
                    while ((sym = tok.nextSymbol()) !== null) {
                        sym.offsetStart(start);
                        results.push(sym);
                    }
                });
                return results;
            };
            return LanguageCharacteristics;
        })();
        Parser.LanguageCharacteristics = LanguageCharacteristics;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            (function (AcceptedCharacters) {
                AcceptedCharacters[AcceptedCharacters["None"] = 0] = "None";
                AcceptedCharacters[AcceptedCharacters["NewLine"] = 1] = "NewLine";
                AcceptedCharacters[AcceptedCharacters["WhiteSpace"] = 2] = "WhiteSpace";
                AcceptedCharacters[AcceptedCharacters["NonWhiteSpace"] = 4] = "NonWhiteSpace";
                AcceptedCharacters[AcceptedCharacters["AllWhiteSpace"] = 3] = "AllWhiteSpace";
                AcceptedCharacters[AcceptedCharacters["Any"] = 7] = "Any";
                AcceptedCharacters[AcceptedCharacters["AnyExceptNewLine"] = 6] = "AnyExceptNewLine";
            })(SyntaxTree.AcceptedCharacters || (SyntaxTree.AcceptedCharacters = {}));
            var AcceptedCharacters = SyntaxTree.AcceptedCharacters;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../SourceLocation.ts" />
/// <reference path="ITextDocument.ts" />
/// <reference path="TextReader.ts" />"
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var TextDocumentReader = (function (_super) {
            __extends(TextDocumentReader, _super);
            function TextDocumentReader(source) {
                _super.call(this);
                this._document = source;
            }
            Object.defineProperty(TextDocumentReader.prototype, "document", {
                get: function () {
                    return this._document;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextDocumentReader.prototype, "length", {
                get: function () {
                    return this._document.length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextDocumentReader.prototype, "location", {
                get: function () {
                    return this._document.location;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextDocumentReader.prototype, "position", {
                get: function () {
                    return this._document.position;
                },
                set: function (value) {
                    this._document.position = value;
                },
                enumerable: true,
                configurable: true
            });
            TextDocumentReader.prototype.beginLookahead = function () {
                var _this = this;
                var start = this.position;
                return new Text.LookaheadToken(function () { return _this.position = start; });
            };
            TextDocumentReader.prototype.peek = function () {
                return this._document.peek();
            };
            TextDocumentReader.prototype.read = function (buffer, index, count) {
                if (arguments.length === 3) {
                    return _super.prototype.read.call(this, buffer, index, count);
                }
                return this._document.read();
            };
            TextDocumentReader.prototype.seek = function (count) {
                this.position += count;
            };
            TextDocumentReader.prototype.toDocument = function () {
                return this;
            };
            return TextDocumentReader;
        })(Text.TextReader);
        Text.TextDocumentReader = TextDocumentReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="SyntaxTree/BlockBuilder.ts" />
/// <reference path="SyntaxTree/BlockType.ts" />
/// <reference path="SyntaxTree/Span.ts" />
/// <reference path="SyntaxTree/AcceptedCharacters.ts" />
/// <reference path="../ErrorSink.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/TextDocumentReader.ts" />
/// <reference path="ParserBase.ts" />
/// <reference path="../RazorError.ts" />
/// <reference path="../Internals/DisposableAction.ts" />
/// <reference path="../Internals/IDisposable.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../ParserResults.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var BlockBuilder = Razor.Parser.SyntaxTree.BlockBuilder;
        var AcceptedCharacters = Razor.Parser.SyntaxTree.AcceptedCharacters;
        var TextDocumentReader = Razor.Text.TextDocumentReader;
        var DisposableAction = Razor.DisposableAction;
        var ParserResults = Razor.ParserResults;
        var EOF = -1;
        var ParserContext = (function () {
            function ParserContext(source, codeParser, markupParser, activeParser, errorSink) {
                this._blockStack = [];
                this._terminated = false;
                this._source = new TextDocumentReader(source);
                this._codeParser = codeParser;
                this._markupParser = markupParser;
                this._activeParser = activeParser;
                this._errorSink = errorSink;
            }
            Object.defineProperty(ParserContext.prototype, "activeParser", {
                get: function () {
                    return this._activeParser;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "blockStack", {
                get: function () {
                    return this._blockStack;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "codeParser", {
                get: function () {
                    return this._codeParser;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "currentBlock", {
                get: function () {
                    if (this._blockStack.length > 0) {
                        return this._blockStack[this._blockStack.length - 1];
                    }
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "currentCharacter", {
                get: function () {
                    if (this._terminated) {
                        return '\0';
                    }
                    var ch = this.source.peek();
                    if (ch === EOF) {
                        return '\0';
                    }
                    return ch;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "endOfFile", {
                get: function () {
                    return this._terminated || this.source.peek() === EOF;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "errors", {
                get: function () {
                    return this._errorSink.errors;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "lastAcceptedCharacters", {
                get: function () {
                    return AcceptedCharacters.None;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "lastSpan", {
                get: function () {
                    return this._lastSpan;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "markupParser", {
                get: function () {
                    return this._markupParser;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserContext.prototype, "source", {
                get: function () {
                    return this._source;
                },
                enumerable: true,
                configurable: true
            });
            ParserContext.prototype.addSpan = function (span) {
                if (this._blockStack.length === 0) {
                    throw "No current block";
                }
                this._blockStack[this._blockStack.length - 1].children.push(span);
                this._lastSpan = span;
            };
            ParserContext.prototype.completeParse = function () {
                if (this._blockStack.length === 0) {
                    throw "Cannot complete tree - no root block";
                }
                if (this._blockStack.length !== 1) {
                    throw "Cannot complete tree - outstanding blocks";
                }
                return new ParserResults(this._blockStack[this._blockStack.length - 1].build(), [], this._errorSink);
            };
            ParserContext.prototype.endBlock = function () {
                if (this._blockStack.length === 0) {
                    throw "End block called without matching start block";
                }
                if (this._blockStack.length > 1) {
                    var block = this._blockStack.pop();
                    this._blockStack[this._blockStack.length - 1].children.push(block.build());
                }
                else {
                    this._terminated = true;
                }
            };
            ParserContext.prototype.isWithin = function (type) {
                for (var i = 0; i < this._blockStack.length; i++) {
                    if (this._blockStack[i].type === type) {
                        return true;
                    }
                }
                return false;
            };
            ParserContext.prototype.onError = function (errorOrLocation, message, length) {
                this._errorSink.onError(errorOrLocation, message, length);
            };
            ParserContext.prototype.startBlock = function (blockType) {
                var _this = this;
                var builder = new BlockBuilder();
                builder.type = blockType;
                return new DisposableAction(function () { return _this.endBlock(); }, this);
            };
            ParserContext.prototype.switchActiveParser = function () {
                if (this.activeParser === this.codeParser) {
                    this._activeParser = this.markupParser;
                }
                else {
                    this._activeParser = this.codeParser;
                }
            };
            return ParserContext;
        })();
        Parser.ParserContext = ParserContext;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="ParserContext.ts" />
/// <reference path="SyntaxTree/SpanBuilder.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/Tuple.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var ParserBase = (function () {
            function ParserBase() {
            }
            Object.defineProperty(ParserBase.prototype, "isMarkupParser", {
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ParserBase.prototype, "otherParser", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            ParserBase.prototype.buildSpan = function (span, start, content) {
                return null;
            };
            ParserBase.prototype.parseBlock = function () { };
            ParserBase.prototype.parseDocument = function () {
                throw "Not a markup parser";
            };
            ParserBase.prototype.parseSection = function (nestingSequences, caseSensitive) {
                throw "Not a markup parser";
            };
            return ParserBase;
        })();
        Parser.ParserBase = ParserBase;
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="SyntaxTreeNode.ts" />
var Razor;
(function (Razor) {
    var Parser;
    (function (Parser) {
        var SyntaxTree;
        (function (SyntaxTree) {
            var EquivalenceComparer = (function () {
                function EquivalenceComparer() {
                }
                EquivalenceComparer.prototype.equals = function (nodeX, nodeY) {
                    if (nodeX === nodeY) {
                        return true;
                    }
                    return (!!nodeX && nodeX.equivalentTo(nodeY));
                };
                return EquivalenceComparer;
            })();
            SyntaxTree.EquivalenceComparer = EquivalenceComparer;
        })(SyntaxTree = Parser.SyntaxTree || (Parser.SyntaxTree = {}));
    })(Parser = Razor.Parser || (Razor.Parser = {}));
})(Razor || (Razor = {}));
/// <reference path="../Text/ITextBuffer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/LookaheadToken.ts" />
/// <reference path="../Text/SeekableTextReader.ts" />
var Razor;
(function (Razor) {
    var Tests;
    (function (Tests) {
        var LookaheadToken = Razor.Text.LookaheadToken;
        var SeekableTextReader = Razor.Text.SeekableTextReader;
        var EOF = -1;
        var StringTextBuffer = (function () {
            function StringTextBuffer(buffer) {
                this._buffer = buffer || '';
                this._position = 0;
                this._length = this._buffer.length;
            }
            Object.defineProperty(StringTextBuffer.prototype, "length", {
                get: function () {
                    return this._length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StringTextBuffer.prototype, "position", {
                get: function () {
                    return this._position;
                },
                set: function (value) {
                    this._position = value;
                },
                enumerable: true,
                configurable: true
            });
            StringTextBuffer.prototype.beginLookahead = function () {
                var _this = this;
                var start = this.position;
                return new LookaheadToken(function () { return _this.position = start; });
            };
            StringTextBuffer.prototype.peek = function () {
                if (this.position >= this._buffer.length) {
                    return EOF;
                }
                return this._buffer[this.position];
            };
            StringTextBuffer.prototype.read = function () {
                if (this.position >= this._buffer.length) {
                    return EOF;
                }
                return this._buffer[this.position++];
            };
            StringTextBuffer.prototype.readToEnd = function () {
                return this._buffer.substr(this.position);
            };
            StringTextBuffer.prototype.seek = function (count) {
                this.position += count;
            };
            StringTextBuffer.prototype.toDocument = function () {
                return new SeekableTextReader(this);
            };
            return StringTextBuffer;
        })();
        Tests.StringTextBuffer = StringTextBuffer;
    })(Tests = Razor.Tests || (Razor.Tests = {}));
})(Razor || (Razor = {}));
/// <reference path="../SourceLocation.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var BacktrackContext = (function () {
            function BacktrackContext(location, bufferIndex) {
                this.location = location;
                this.bufferIndex = bufferIndex;
                this.bufferIndex = this.bufferIndex || 0;
            }
            return BacktrackContext;
        })();
        Text.BacktrackContext = BacktrackContext;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="TextReader.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/IDisposable.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var LookaheadTextReader = (function (_super) {
            __extends(LookaheadTextReader, _super);
            function LookaheadTextReader() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(LookaheadTextReader.prototype, "currentLocation", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            LookaheadTextReader.prototype.beginLookahead = function () {
                return null;
            };
            LookaheadTextReader.prototype.cancelBacktrack = function () {
            };
            return LookaheadTextReader;
        })(Text.TextReader);
        Text.LookaheadTextReader = LookaheadTextReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="BacktrackContext.ts" />
/// <reference path="SourceLocationTracker.ts" />
/// <reference path="TextReader.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/DisposableAction.ts" />
/// <reference path="LookaheadTextReader.ts" />
/// <reference path="StringBuilder.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var EOF = -1;
        var BufferingTextReader = (function (_super) {
            __extends(BufferingTextReader, _super);
            function BufferingTextReader(source) {
                _super.call(this);
                this._backtrackStack = [];
                this.buffer = null;
                this._source = source;
                this._locationTracker = new Text.SourceLocationTracker();
                this.updateCurrentCharacter();
            }
            Object.defineProperty(BufferingTextReader.prototype, "currentCharacter", {
                get: function () {
                    return this._currentCharacter;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BufferingTextReader.prototype, "currentLocation", {
                get: function () {
                    return this._locationTracker.currentLocation;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BufferingTextReader.prototype, "innerReader", {
                get: function () {
                    return this._source;
                },
                enumerable: true,
                configurable: true
            });
            BufferingTextReader.prototype.beginLookahead = function () {
                var _this = this;
                if (this.buffer === null) {
                    this.buffer = new Text.StringBuilder();
                }
                if (!this.buffering) {
                    this.expandBuffer();
                    this.buffering = true;
                }
                var context = new Text.BacktrackContext(this.currentLocation, this._currentBufferPosition);
                this._backtrackStack.push(context);
                return new Razor.DisposableAction(function () { return _this.endLookahead(context); }, this);
            };
            BufferingTextReader.prototype.cancelBacktrack = function () {
                this._backtrackStack.pop();
            };
            BufferingTextReader.prototype.dispose = function () {
                this._source.dispose();
                _super.prototype.dispose.call(this);
            };
            BufferingTextReader.prototype.endLookahead = function (context) {
                if (this._backtrackStack.length > 0 && this._backtrackStack[this._backtrackStack.length - 1] === context) {
                    this._backtrackStack.pop();
                    this._currentBufferPosition = context.bufferIndex;
                    this._locationTracker.currentLocation = context.location;
                    this.updateCurrentCharacter();
                }
            };
            BufferingTextReader.prototype.expandBuffer = function () {
                var ch = this.innerReader.read();
                if (ch !== EOF) {
                    this.buffer.append(ch);
                    this._currentBufferPosition = this.buffer.length - 1;
                    return true;
                }
                return false;
            };
            BufferingTextReader.prototype.nextCharacter = function () {
                var prevChar = this.currentCharacter;
                if (prevChar === EOF) {
                    return;
                }
                if (this.buffering) {
                    if (this._currentBufferPosition >= this.buffer.length - 1) {
                        if (this._backtrackStack.length === 0) {
                            this.buffer.clear();
                            this._currentBufferPosition = 0;
                            this.buffering = false;
                        }
                        else if (!this.expandBuffer()) {
                            this._currentBufferPosition = this.buffer.length;
                        }
                    }
                    else {
                        this._currentBufferPosition++;
                    }
                }
                else {
                    this.innerReader.read();
                }
                this.updateCurrentCharacter();
                this._locationTracker.updateLocation(prevChar, this.currentCharacter);
            };
            BufferingTextReader.prototype.read = function (buffer, index, count) {
                if (arguments.length === 3) {
                    return _super.prototype.read.call(this, buffer, index, count);
                }
                var chr = this.currentCharacter;
                this.nextCharacter();
                return chr;
            };
            BufferingTextReader.prototype.peek = function () {
                return this.currentCharacter;
            };
            BufferingTextReader.prototype.updateCurrentCharacter = function () {
                if (this.buffering && this._currentBufferPosition < this.buffer.length) {
                    this._currentCharacter = this.buffer.charAt(this._currentBufferPosition);
                }
                else {
                    this._currentCharacter = this.innerReader.peek();
                }
            };
            return BufferingTextReader;
        })(Text.LookaheadTextReader);
        Text.BufferingTextReader = BufferingTextReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../SourceLocation.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var SourceSpan = (function () {
            function SourceSpan() {
            }
            return SourceSpan;
        })();
        Text.SourceSpan = SourceSpan;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="../Internals/IDisposable.ts" />
/// <reference path="TextReader.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var EOF = -1;
        var StringTextReader = (function (_super) {
            __extends(StringTextReader, _super);
            function StringTextReader(str) {
                _super.call(this);
                this._string = str;
                this._position = 0;
                this._length = (!!str ? str.length : 0);
            }
            StringTextReader.prototype.peek = function () {
                if (!!this._string) {
                    if (this._position === this._length) {
                        return EOF;
                    }
                    return this._string[this._position];
                }
                return EOF;
            };
            StringTextReader.prototype.read = function () {
                if (!!this._string) {
                    if (this._position === this._length) {
                        return EOF;
                    }
                    return this._string[this._position++];
                }
                return EOF;
            };
            StringTextReader.prototype.readLine = function () {
                var val, i = this._position, chr;
                if (!!this._string) {
                    return '';
                }
                while (i < this._length) {
                    chr = this._string[i];
                    if (chr === '\r' || chr === '\n') {
                        val = this._string.substr(this._position, i - this._position);
                        this._position = i + 1;
                        if (chr === '\r' && this._position < this._length && this._string[this._position] === '\n') {
                            this._position++;
                        }
                        return val;
                    }
                    i++;
                }
                if (i > this._position) {
                    val = this._string[this._position, i - this._position];
                    this._position = i;
                    return val;
                }
                return null;
            };
            StringTextReader.prototype.readToEnd = function () {
                var val;
                if (!this._string) {
                    return null;
                }
                if (this._position === 0) {
                    return this._string;
                }
                val = this._string.substr(this._position, this._length - this._position);
                this._position = this._length;
                return val;
            };
            return StringTextReader;
        })(Text.TextReader);
        Text.StringTextReader = StringTextReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
/// <reference path="LookaheadTextReader.ts" />
/// <reference path="../SourceLocation.ts" />
/// <reference path="../Internals/IDisposable.ts" />
/// <reference path="LookaheadToken.ts" />
/// <reference path="ITextBuffer.ts" />
/// <reference path="BacktrackContext.ts" />
/// <reference path="SourceLocationTracker.ts" />
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        var EOF = -1;
        var TextBufferReader = (function (_super) {
            __extends(TextBufferReader, _super);
            function TextBufferReader(buffer) {
                _super.call(this);
                this._bookmarks = [];
                this._tracker = new Text.SourceLocationTracker();
                this._buffer = buffer;
            }
            Object.defineProperty(TextBufferReader.prototype, "buffer", {
                get: function () {
                    return this._buffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TextBufferReader.prototype, "currentLocation", {
                get: function () {
                    return this._tracker.currentLocation;
                },
                enumerable: true,
                configurable: true
            });
            TextBufferReader.prototype.beginLookahead = function () {
                var _this = this;
                var context = new Text.BacktrackContext(this.currentLocation);
                this._bookmarks.push(context);
                return new Razor.DisposableAction(function () {
                    _this.endLookahead(context);
                });
            };
            TextBufferReader.prototype.cancelBacktrack = function () {
                this._bookmarks.pop();
            };
            TextBufferReader.prototype.endLookahead = function (context) {
                if (this._bookmarks.length > 0 && this._bookmarks[this._bookmarks.length - 1] === context) {
                    this._bookmarks.pop();
                    this._tracker.currentLocation = context.location;
                    this._buffer.position = context.location.absoluteIndex;
                }
            };
            TextBufferReader.prototype.dispose = function () {
                var dis = this._buffer['dispose'];
                if (!!dis) {
                    dis.apply(this._buffer, []);
                }
            };
            TextBufferReader.prototype.peek = function () {
                return this._buffer.peek();
            };
            TextBufferReader.prototype.read = function (buffer, index, count) {
                if (arguments.length === 3) {
                    return _super.prototype.read.call(this, buffer, index, count);
                }
                var read = this._buffer.read();
                if (read !== EOF) {
                    var nextChar = '\0', next = this.peek();
                    if (next !== EOF) {
                        nextChar = next;
                    }
                    this._tracker.updateLocation(read, nextChar);
                }
                return read;
            };
            return TextBufferReader;
        })(Text.LookaheadTextReader);
        Text.TextBufferReader = TextBufferReader;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Text;
    (function (Text) {
        (function (TextChangeType) {
            TextChangeType[TextChangeType["Insert"] = 0] = "Insert";
            TextChangeType[TextChangeType["Remove"] = 1] = "Remove";
        })(Text.TextChangeType || (Text.TextChangeType = {}));
        var TextChangeType = Text.TextChangeType;
    })(Text = Razor.Text || (Razor.Text = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            (function (HtmlSymbolType) {
                HtmlSymbolType[HtmlSymbolType["Unknown"] = 0] = "Unknown";
                HtmlSymbolType[HtmlSymbolType["Text"] = 1] = "Text";
                HtmlSymbolType[HtmlSymbolType["WhiteSpace"] = 2] = "WhiteSpace";
                HtmlSymbolType[HtmlSymbolType["NewLine"] = 3] = "NewLine";
                HtmlSymbolType[HtmlSymbolType["OpenAngle"] = 4] = "OpenAngle";
                HtmlSymbolType[HtmlSymbolType["Bang"] = 5] = "Bang";
                HtmlSymbolType[HtmlSymbolType["ForwardSlash"] = 6] = "ForwardSlash";
                HtmlSymbolType[HtmlSymbolType["QuestionMark"] = 7] = "QuestionMark";
                HtmlSymbolType[HtmlSymbolType["DoubleHyphen"] = 8] = "DoubleHyphen";
                HtmlSymbolType[HtmlSymbolType["LeftBracket"] = 9] = "LeftBracket";
                HtmlSymbolType[HtmlSymbolType["CloseAngle"] = 10] = "CloseAngle";
                HtmlSymbolType[HtmlSymbolType["RightBracket"] = 11] = "RightBracket";
                HtmlSymbolType[HtmlSymbolType["Equals"] = 12] = "Equals";
                HtmlSymbolType[HtmlSymbolType["DoubleQuote"] = 13] = "DoubleQuote";
                HtmlSymbolType[HtmlSymbolType["SingleQuote"] = 14] = "SingleQuote";
                HtmlSymbolType[HtmlSymbolType["Transition"] = 15] = "Transition";
                HtmlSymbolType[HtmlSymbolType["Colon"] = 16] = "Colon";
                HtmlSymbolType[HtmlSymbolType["RazorComment"] = 17] = "RazorComment";
                HtmlSymbolType[HtmlSymbolType["RazorCommentStar"] = 18] = "RazorCommentStar";
                HtmlSymbolType[HtmlSymbolType["RazorCommentTransition"] = 19] = "RazorCommentTransition";
            })(Symbols.HtmlSymbolType || (Symbols.HtmlSymbolType = {}));
            var HtmlSymbolType = Symbols.HtmlSymbolType;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="SymbolBase.ts" />
/// <reference path="HtmlSymbolType.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../RazorError.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            var HtmlSymbol = (function (_super) {
                __extends(HtmlSymbol, _super);
                function HtmlSymbol(start, content, type, errors) {
                    _super.call(this, start, content, type, errors || []);
                }
                Object.defineProperty(HtmlSymbol.prototype, "runtimeTypeName", {
                    get: function () {
                        return "HtmlSymbol";
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(HtmlSymbol.prototype, "typeName", {
                    get: function () {
                        return Symbols.HtmlSymbolType[this.type];
                    },
                    enumerable: true,
                    configurable: true
                });
                return HtmlSymbol;
            })(Symbols.SymbolBase);
            Symbols.HtmlSymbol = HtmlSymbol;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="Symbols/ISymbol.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../StateMachine.ts" />
/// <reference path="ITokenizer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/TextDocumentReader.ts" />
/// <reference path="../Text/StringBuilder.ts" />
/// <reference path="../RazorError.ts" />
/// <reference path="Symbols/SymbolBase.ts" />
/// <reference path="Symbols/ISymbol.ts" />
/// <reference path="../Internals/Using.ts" />
/// <reference path="../Parser/ParserHelpers.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer_1) {
        var TextDocumentReader = Razor.Text.TextDocumentReader;
        var StringBuilder = Razor.Text.StringBuilder;
        var using = Razor.Using;
        var ParserHelpers = Razor.Parser.ParserHelpers;
        var EOF = -1;
        var Tokenizer = (function (_super) {
            __extends(Tokenizer, _super);
            function Tokenizer(source) {
                _super.call(this);
                this._source = new TextDocumentReader(source);
                this._buffer = new StringBuilder();
                this._currentErrors = [];
                this.startSymbol();
            }
            Object.defineProperty(Tokenizer.prototype, "buffer", {
                get: function () {
                    return this._buffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "currentCharacter", {
                get: function () {
                    var peek = this.source.peek();
                    return (peek === EOF) ? '\0' : peek;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "currentErrors", {
                get: function () {
                    return this._currentErrors;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "currentLocation", {
                get: function () {
                    return this.source.location;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "currentStart", {
                get: function () {
                    return this._currentStart;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "endOfFile", {
                get: function () {
                    return this.source.peek() === EOF;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "haveContent", {
                get: function () {
                    return this.buffer.length > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "razorCommentStarType", {
                get: function () { return null; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "razorCommentType", {
                get: function () { return null; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "razorCommentTransitionType", {
                get: function () { return null; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "source", {
                get: function () {
                    return this._source;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tokenizer.prototype, "sourceDocument", {
                get: function () {
                    return this.source;
                },
                enumerable: true,
                configurable: true
            });
            Tokenizer.prototype.afterRazorCommentTransition = function () {
                if (this.currentCharacter !== '*') {
                    return this.transition(this.startState);
                }
                this.takeCurrent();
                return this.transition(this.endSymbol(this.razorCommentStarType), this.razorCommentBody);
            };
            Tokenizer.prototype.at = function (expected, caseSensitive) {
                return this.lookahead(expected, false, caseSensitive);
            };
            Tokenizer.prototype.createSymbol = function (start, content, type, errors) {
                return null;
            };
            Tokenizer.prototype.charOrWhiteSpace = function (character) {
                return function (c) { return c === character || ParserHelpers.isWhiteSpace(c) || ParserHelpers.isNewLine(c); };
            };
            Tokenizer.prototype.endSymbol = function (startOrType, type) {
                if (startOrType instanceof Razor.SourceLocation) {
                    var sym = null;
                    if (this.haveContent) {
                        sym = this.createSymbol(startOrType, this.buffer.toString(), type, this.currentErrors.slice(0));
                    }
                    this.startSymbol();
                    return sym;
                }
                return this.endSymbol(this.currentStart, startOrType);
            };
            Tokenizer.prototype.lookahead = function (expected, takeIfMatch, caseSensitive) {
                var _this = this;
                var filter = function (c) { return c; };
                if (!caseSensitive) {
                    filter = function (c) { return c.toLowerCase(); };
                }
                if (expected.length === 0 || filter(this.currentCharacter) !== filter(expected[0])) {
                    return false;
                }
                var oldBuffer;
                if (takeIfMatch) {
                    oldBuffer = this.buffer.toString();
                }
                var found = true;
                var lookahead = this.source.beginLookahead();
                using(lookahead, function () {
                    for (var i = 0; i < expected.length; i++) {
                        if (filter(_this.currentCharacter) !== filter(expected[i])) {
                            if (takeIfMatch) {
                                _this.buffer.clear();
                                _this.buffer.append(oldBuffer);
                            }
                            found = false;
                            break;
                        }
                        if (takeIfMatch) {
                            _this.takeCurrent();
                        }
                        else {
                            _this.moveNext();
                        }
                    }
                    if (takeIfMatch && found) {
                        lookahead.accept();
                    }
                });
                return found;
            };
            Tokenizer.prototype.moveNext = function () {
                this.source.read();
            };
            Tokenizer.prototype.nextSymbol = function () {
                this.startSymbol();
                if (this.endOfFile) {
                    return null;
                }
                var sym = this.turn();
                return sym || null;
            };
            Tokenizer.prototype.peek = function () {
                var result;
                var that = this;
                using(this, this.source.beginLookahead(), function () {
                    that.moveNext();
                    result = that.currentCharacter;
                });
                return result;
            };
            Tokenizer.prototype.razorCommentBody = function () {
                var _this = this;
                var that = this;
                this.takeUntil(function (c) { return c === '*'; });
                if (this.currentCharacter === '*') {
                    var star = this.currentCharacter;
                    var start = this.currentLocation;
                    this.moveNext();
                    if (!this.endOfFile && this.currentCharacter === '@') {
                        var next = (function () {
                            _this.buffer.append(star);
                            return _this.transition(_this.endSymbol(start, _this.razorCommentStarType), (function () {
                                if (_this.currentCharacter !== '@') {
                                    return _this.transition(_this.startState);
                                }
                                _this.takeCurrent();
                                return _this.transition(_this.endSymbol(_this.razorCommentTransitionType), _this.startState);
                            }));
                        });
                        if (this.haveContent) {
                            return this.transition(this.endSymbol(this.razorCommentType), next);
                        }
                        return this.transition(next);
                    }
                    else {
                        this.buffer.append(star);
                        return this.stay();
                    }
                }
                return this.transition(this.endSymbol(this.razorCommentType), this.startState);
            };
            Tokenizer.prototype.reset = function () {
                this.currentState = this.startState;
            };
            Tokenizer.prototype.resumeSymbol = function (previous) {
                if (previous.start.absoluteIndex + previous.content.length !== this.currentStart.absoluteIndex) {
                    throw "Cannot resume symbol unless it is the previous symbol";
                }
                this._currentStart = previous.start;
                var newContent = this.buffer.toString();
                this.buffer.clear();
                this.buffer.append(previous.content);
                this.buffer.append(newContent);
            };
            Tokenizer.prototype.single = function (type) {
                this.takeCurrent();
                return this.endSymbol(type);
            };
            Tokenizer.prototype.startSymbol = function () {
                this.buffer.clear();
                this._currentStart = this.currentLocation;
                this._currentErrors = [];
            };
            Tokenizer.prototype.takeAll = function (expected, caseSensitive) {
                return this.lookahead(expected, true, caseSensitive);
            };
            Tokenizer.prototype.takeCurrent = function () {
                if (this.endOfFile) {
                    return;
                }
                this.buffer.append(this.currentCharacter);
                this.moveNext();
            };
            Tokenizer.prototype.takeString = function (input, caseSensitive) {
                var position = 0;
                var filter = function (c) { return c; };
                if (caseSensitive) {
                    filter = function (c) { return c.toLowerCase(); };
                }
                while (!this.endOfFile && position < input.length && filter(this.currentCharacter) == filter(input[position++])) {
                    this.takeCurrent();
                }
                return (position === input.length);
            };
            Tokenizer.prototype.takeUntil = function (predicate) {
                while (!this.endOfFile && !predicate(this.currentCharacter)) {
                    this.takeCurrent();
                }
                return !this.endOfFile;
            };
            return Tokenizer;
        })(Razor.StateMachine);
        Tokenizer_1.Tokenizer = Tokenizer;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="Symbols/HtmlSymbol.ts" />
/// <reference path="Symbols/HtmlSymbolType.ts" />
/// <reference path="Tokenizer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/SeekableTextReader.ts" />
/// <reference path="../Internals/Using.ts" />
/// <reference path="../Parser/ParserHelpers.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var HtmlSymbol = Razor.Tokenizer.Symbols.HtmlSymbol;
        var HtmlSymbolType = Razor.Tokenizer.Symbols.HtmlSymbolType;
        var SeekableTextReader = Razor.Text.SeekableTextReader;
        var ParserHelpers = Razor.Parser.ParserHelpers;
        var using = Razor.Using;
        var transitionChar = '@';
        var HtmlTokenizer = (function (_super) {
            __extends(HtmlTokenizer, _super);
            function HtmlTokenizer(source) {
                _super.call(this, source);
                this.currentState = this.data;
            }
            Object.defineProperty(HtmlTokenizer.prototype, "startState", {
                get: function () {
                    return this.data;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HtmlTokenizer.prototype, "razorCommentStarType", {
                get: function () { return HtmlSymbolType.RazorCommentStar; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HtmlTokenizer.prototype, "razorCommentType", {
                get: function () { return HtmlSymbolType.RazorComment; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HtmlTokenizer.prototype, "razorCommentTransitionType", {
                get: function () { return HtmlSymbolType.RazorCommentTransition; },
                enumerable: true,
                configurable: true
            });
            HtmlTokenizer.prototype.atSymbol = function () {
                return this.currentCharacter === '<' ||
                    this.currentCharacter === '!' ||
                    this.currentCharacter === '/' ||
                    this.currentCharacter === '?' ||
                    this.currentCharacter === '[' ||
                    this.currentCharacter === '>' ||
                    this.currentCharacter === ']' ||
                    this.currentCharacter === '=' ||
                    this.currentCharacter === '"' ||
                    this.currentCharacter === "'" ||
                    this.currentCharacter === '@' ||
                    (this.currentCharacter === '-' && this.peek() === '-');
            };
            HtmlTokenizer.prototype.createSymbol = function (start, content, type, errors) {
                return new HtmlSymbol(start, content, type, errors);
            };
            HtmlTokenizer.prototype.data = function () {
                var _this = this;
                if (ParserHelpers.isWhiteSpace(this.currentCharacter)) {
                    return this.stay(this.whiteSpace());
                }
                else if (ParserHelpers.isNewLine(this.currentCharacter)) {
                    return this.stay(this.newLine());
                }
                else if (this.currentCharacter === transitionChar) {
                    this.takeCurrent();
                    if (this.currentCharacter === '*') {
                        return this.transition(this.endSymbol(HtmlSymbolType.RazorCommentTransition), this.afterRazorCommentTransition);
                    }
                    else if (this.currentCharacter === transitionChar) {
                        return this.transition(this.endSymbol(HtmlSymbolType.Transition), (function () {
                            _this.takeCurrent();
                            return _this.transition(_this.endSymbol(HtmlSymbolType.Transition), _this.data);
                        }));
                    }
                    return this.stay(this.endSymbol(HtmlSymbolType.Transition));
                }
                else if (this.atSymbol()) {
                    return this.stay(this.symbol());
                }
                else {
                    return this.transition(this.text);
                }
            };
            HtmlTokenizer.prototype.newLine = function () {
                var check = (this.currentCharacter === '\r');
                this.takeCurrent();
                if (check && (this.currentCharacter === '\n')) {
                    this.takeCurrent();
                }
                return this.endSymbol(HtmlSymbolType.NewLine);
            };
            HtmlTokenizer.prototype.symbol = function () {
                var sym = this.currentCharacter;
                this.takeCurrent();
                switch (sym) {
                    case '<': return this.endSymbol(HtmlSymbolType.OpenAngle);
                    case '!': return this.endSymbol(HtmlSymbolType.Bang);
                    case '/': return this.endSymbol(HtmlSymbolType.ForwardSlash);
                    case '?': return this.endSymbol(HtmlSymbolType.QuestionMark);
                    case '[': return this.endSymbol(HtmlSymbolType.LeftBracket);
                    case '>': return this.endSymbol(HtmlSymbolType.CloseAngle);
                    case ']': return this.endSymbol(HtmlSymbolType.RightBracket);
                    case '=': return this.endSymbol(HtmlSymbolType.Equals);
                    case '"': return this.endSymbol(HtmlSymbolType.DoubleQuote);
                    case "'": return this.endSymbol(HtmlSymbolType.SingleQuote);
                    case '-':
                        {
                            this.takeCurrent();
                            return this.endSymbol(HtmlSymbolType.DoubleHyphen);
                        }
                    default:
                        {
                            return this.endSymbol(HtmlSymbolType.Unknown);
                        }
                }
            };
            HtmlTokenizer.prototype.text = function () {
                var prev = '\0';
                while (!this.endOfFile && !ParserHelpers.isWhiteSpaceOrNewLine(this.currentCharacter) && !this.atSymbol()) {
                    prev = this.currentCharacter;
                    this.takeCurrent();
                }
                if (this.currentCharacter === transitionChar) {
                    var next = this.peek();
                    if (ParserHelpers.isLetterOrDecimalDigit(prev) && ParserHelpers.isLetterOrDecimalDigit(next)) {
                        this.takeCurrent();
                        return this.stay();
                    }
                }
                return this.transition(this.endSymbol(HtmlSymbolType.Text), this.data);
            };
            HtmlTokenizer.tokenize = function (content) {
                var reader = new SeekableTextReader(content);
                var symbols = [];
                using(reader, function () {
                    var tok = new HtmlTokenizer(reader);
                    var sym;
                    while ((sym = tok.nextSymbol()) !== null) {
                        symbols.push(sym);
                    }
                });
                return symbols;
            };
            HtmlTokenizer.prototype.whiteSpace = function () {
                while (ParserHelpers.isWhiteSpace(this.currentCharacter)) {
                    this.takeCurrent();
                }
                return this.endSymbol(HtmlSymbolType.WhiteSpace);
            };
            return HtmlTokenizer;
        })(Tokenizer.Tokenizer);
        Tokenizer.HtmlTokenizer = HtmlTokenizer;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="../Parser/ParserHelpers.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var JavaScriptHelpers = (function () {
            function JavaScriptHelpers() {
            }
            JavaScriptHelpers.isIdentifierStart = function (character) {
                return /[_$a-zA-Z]/.test(character);
            };
            JavaScriptHelpers.isIdentifierPart = function (character) {
                return /[_a-zA-Z0-9]/.test(character);
            };
            return JavaScriptHelpers;
        })();
        Tokenizer.JavaScriptHelpers = JavaScriptHelpers;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            (function (JavaScriptKeyword) {
                JavaScriptKeyword[JavaScriptKeyword["Await"] = 0] = "Await";
                JavaScriptKeyword[JavaScriptKeyword["Break"] = 1] = "Break";
                JavaScriptKeyword[JavaScriptKeyword["Case"] = 2] = "Case";
                JavaScriptKeyword[JavaScriptKeyword["Class"] = 3] = "Class";
                JavaScriptKeyword[JavaScriptKeyword["Catch"] = 4] = "Catch";
                JavaScriptKeyword[JavaScriptKeyword["Const"] = 5] = "Const";
                JavaScriptKeyword[JavaScriptKeyword["Continue"] = 6] = "Continue";
                JavaScriptKeyword[JavaScriptKeyword["Debugger"] = 7] = "Debugger";
                JavaScriptKeyword[JavaScriptKeyword["Default"] = 8] = "Default";
                JavaScriptKeyword[JavaScriptKeyword["Delete"] = 9] = "Delete";
                JavaScriptKeyword[JavaScriptKeyword["Do"] = 10] = "Do";
                JavaScriptKeyword[JavaScriptKeyword["Else"] = 11] = "Else";
                JavaScriptKeyword[JavaScriptKeyword["Enum"] = 12] = "Enum";
                JavaScriptKeyword[JavaScriptKeyword["Export"] = 13] = "Export";
                JavaScriptKeyword[JavaScriptKeyword["Extends"] = 14] = "Extends";
                JavaScriptKeyword[JavaScriptKeyword["False"] = 15] = "False";
                JavaScriptKeyword[JavaScriptKeyword["Finally"] = 16] = "Finally";
                JavaScriptKeyword[JavaScriptKeyword["For"] = 17] = "For";
                JavaScriptKeyword[JavaScriptKeyword["Function"] = 18] = "Function";
                JavaScriptKeyword[JavaScriptKeyword["If"] = 19] = "If";
                JavaScriptKeyword[JavaScriptKeyword["Implements"] = 20] = "Implements";
                JavaScriptKeyword[JavaScriptKeyword["Import"] = 21] = "Import";
                JavaScriptKeyword[JavaScriptKeyword["In"] = 22] = "In";
                JavaScriptKeyword[JavaScriptKeyword["Interface"] = 23] = "Interface";
                JavaScriptKeyword[JavaScriptKeyword["Instanceof"] = 24] = "Instanceof";
                JavaScriptKeyword[JavaScriptKeyword["Let"] = 25] = "Let";
                JavaScriptKeyword[JavaScriptKeyword["New"] = 26] = "New";
                JavaScriptKeyword[JavaScriptKeyword["Null"] = 27] = "Null";
                JavaScriptKeyword[JavaScriptKeyword["Package"] = 28] = "Package";
                JavaScriptKeyword[JavaScriptKeyword["Private"] = 29] = "Private";
                JavaScriptKeyword[JavaScriptKeyword["Protected"] = 30] = "Protected";
                JavaScriptKeyword[JavaScriptKeyword["Public"] = 31] = "Public";
                JavaScriptKeyword[JavaScriptKeyword["Return"] = 32] = "Return";
                JavaScriptKeyword[JavaScriptKeyword["Static"] = 33] = "Static";
                JavaScriptKeyword[JavaScriptKeyword["Super"] = 34] = "Super";
                JavaScriptKeyword[JavaScriptKeyword["Switch"] = 35] = "Switch";
                JavaScriptKeyword[JavaScriptKeyword["This"] = 36] = "This";
                JavaScriptKeyword[JavaScriptKeyword["Throw"] = 37] = "Throw";
                JavaScriptKeyword[JavaScriptKeyword["True"] = 38] = "True";
                JavaScriptKeyword[JavaScriptKeyword["Try"] = 39] = "Try";
                JavaScriptKeyword[JavaScriptKeyword["Typeof"] = 40] = "Typeof";
                JavaScriptKeyword[JavaScriptKeyword["Var"] = 41] = "Var";
                JavaScriptKeyword[JavaScriptKeyword["Void"] = 42] = "Void";
                JavaScriptKeyword[JavaScriptKeyword["While"] = 43] = "While";
                JavaScriptKeyword[JavaScriptKeyword["Yield"] = 44] = "Yield";
            })(Symbols.JavaScriptKeyword || (Symbols.JavaScriptKeyword = {}));
            var JavaScriptKeyword = Symbols.JavaScriptKeyword;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="Symbols/JavaScriptKeyword.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var JavaScriptKeyword = Razor.Tokenizer.Symbols.JavaScriptKeyword;
        var keywords = {
            "await": JavaScriptKeyword.Await,
            "break": JavaScriptKeyword.Break,
            "case": JavaScriptKeyword.Case,
            "class": JavaScriptKeyword.Class,
            "catch": JavaScriptKeyword.Catch,
            "const": JavaScriptKeyword.Const,
            "continue": JavaScriptKeyword.Continue,
            "debugger": JavaScriptKeyword.Debugger,
            "default": JavaScriptKeyword.Default,
            "delete": JavaScriptKeyword.Delete,
            "do": JavaScriptKeyword.Do,
            "else": JavaScriptKeyword.Else,
            "enum": JavaScriptKeyword.Enum,
            "export": JavaScriptKeyword.Export,
            "extends": JavaScriptKeyword.Extends,
            "false": JavaScriptKeyword.False,
            "finally": JavaScriptKeyword.Finally,
            "for": JavaScriptKeyword.For,
            "function": JavaScriptKeyword.Function,
            "if": JavaScriptKeyword.If,
            "implements": JavaScriptKeyword.Implements,
            "import": JavaScriptKeyword.Import,
            "in": JavaScriptKeyword.In,
            "interface": JavaScriptKeyword.Interface,
            "instanceof": JavaScriptKeyword.Instanceof,
            "let": JavaScriptKeyword.Let,
            "new": JavaScriptKeyword.New,
            "null": JavaScriptKeyword.Null,
            "package": JavaScriptKeyword.Package,
            "private": JavaScriptKeyword.Private,
            "protected": JavaScriptKeyword.Protected,
            "public": JavaScriptKeyword.Public,
            "return": JavaScriptKeyword.Return,
            "static": JavaScriptKeyword.Static,
            "super": JavaScriptKeyword.Super,
            "switch": JavaScriptKeyword.Switch,
            "this": JavaScriptKeyword.This,
            "throw": JavaScriptKeyword.Throw,
            "true": JavaScriptKeyword.True,
            "try": JavaScriptKeyword.Try,
            "typeof": JavaScriptKeyword.Typeof,
            "var": JavaScriptKeyword.Var,
            "void": JavaScriptKeyword.Void,
            "while": JavaScriptKeyword.While,
            "yield": JavaScriptKeyword.Yield
        };
        var JavaScriptKeywordDetector = (function () {
            function JavaScriptKeywordDetector() {
            }
            JavaScriptKeywordDetector.symbolTypeForIdentifier = function (id) {
                var keyword = keywords[id];
                if (typeof keyword === "undefined") {
                    keyword = null;
                }
                return keyword;
            };
            return JavaScriptKeywordDetector;
        })();
        Tokenizer.JavaScriptKeywordDetector = JavaScriptKeywordDetector;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            (function (JavaScriptSymbolType) {
                JavaScriptSymbolType[JavaScriptSymbolType["Unknown"] = 0] = "Unknown";
                JavaScriptSymbolType[JavaScriptSymbolType["Identifier"] = 1] = "Identifier";
                JavaScriptSymbolType[JavaScriptSymbolType["Keyword"] = 2] = "Keyword";
                JavaScriptSymbolType[JavaScriptSymbolType["Transition"] = 3] = "Transition";
                JavaScriptSymbolType[JavaScriptSymbolType["IntegerlLiteral"] = 4] = "IntegerlLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["BinaryLiteral"] = 5] = "BinaryLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["OctalLiteral"] = 6] = "OctalLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["HexLiteral"] = 7] = "HexLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["RealLiteral"] = 8] = "RealLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["StringLiteral"] = 9] = "StringLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["RegularExpressionLiteral"] = 10] = "RegularExpressionLiteral";
                JavaScriptSymbolType[JavaScriptSymbolType["NewLine"] = 11] = "NewLine";
                JavaScriptSymbolType[JavaScriptSymbolType["WhiteSpace"] = 12] = "WhiteSpace";
                JavaScriptSymbolType[JavaScriptSymbolType["Comment"] = 13] = "Comment";
                JavaScriptSymbolType[JavaScriptSymbolType["Dot"] = 14] = "Dot";
                JavaScriptSymbolType[JavaScriptSymbolType["Assignment"] = 15] = "Assignment";
                JavaScriptSymbolType[JavaScriptSymbolType["LeftBracket"] = 16] = "LeftBracket";
                JavaScriptSymbolType[JavaScriptSymbolType["RightBracket"] = 17] = "RightBracket";
                JavaScriptSymbolType[JavaScriptSymbolType["LeftParen"] = 18] = "LeftParen";
                JavaScriptSymbolType[JavaScriptSymbolType["RightParen"] = 19] = "RightParen";
                JavaScriptSymbolType[JavaScriptSymbolType["LeftBrace"] = 20] = "LeftBrace";
                JavaScriptSymbolType[JavaScriptSymbolType["RightBrace"] = 21] = "RightBrace";
                JavaScriptSymbolType[JavaScriptSymbolType["Plus"] = 22] = "Plus";
                JavaScriptSymbolType[JavaScriptSymbolType["Minus"] = 23] = "Minus";
                JavaScriptSymbolType[JavaScriptSymbolType["Modulo"] = 24] = "Modulo";
                JavaScriptSymbolType[JavaScriptSymbolType["Increment"] = 25] = "Increment";
                JavaScriptSymbolType[JavaScriptSymbolType["Decrement"] = 26] = "Decrement";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseNot"] = 27] = "BitwiseNot";
                JavaScriptSymbolType[JavaScriptSymbolType["LogicalNot"] = 28] = "LogicalNot";
                JavaScriptSymbolType[JavaScriptSymbolType["Divide"] = 29] = "Divide";
                JavaScriptSymbolType[JavaScriptSymbolType["Multiply"] = 30] = "Multiply";
                JavaScriptSymbolType[JavaScriptSymbolType["Exponentiation"] = 31] = "Exponentiation";
                JavaScriptSymbolType[JavaScriptSymbolType["LessThan"] = 32] = "LessThan";
                JavaScriptSymbolType[JavaScriptSymbolType["LessThanEqualTo"] = 33] = "LessThanEqualTo";
                JavaScriptSymbolType[JavaScriptSymbolType["GreaterThan"] = 34] = "GreaterThan";
                JavaScriptSymbolType[JavaScriptSymbolType["GreaterThenEqualTo"] = 35] = "GreaterThenEqualTo";
                JavaScriptSymbolType[JavaScriptSymbolType["Equal"] = 36] = "Equal";
                JavaScriptSymbolType[JavaScriptSymbolType["StrictEqual"] = 37] = "StrictEqual";
                JavaScriptSymbolType[JavaScriptSymbolType["NotEqual"] = 38] = "NotEqual";
                JavaScriptSymbolType[JavaScriptSymbolType["StrictNotEqual"] = 39] = "StrictNotEqual";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseLeftShift"] = 40] = "BitwiseLeftShift";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseRightShift"] = 41] = "BitwiseRightShift";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseUnsignedRightShift"] = 42] = "BitwiseUnsignedRightShift";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseAnd"] = 43] = "BitwiseAnd";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseOr"] = 44] = "BitwiseOr";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseXor"] = 45] = "BitwiseXor";
                JavaScriptSymbolType[JavaScriptSymbolType["LogicalAnd"] = 46] = "LogicalAnd";
                JavaScriptSymbolType[JavaScriptSymbolType["LogicalOr"] = 47] = "LogicalOr";
                JavaScriptSymbolType[JavaScriptSymbolType["QuestionMark"] = 48] = "QuestionMark";
                JavaScriptSymbolType[JavaScriptSymbolType["Colon"] = 49] = "Colon";
                JavaScriptSymbolType[JavaScriptSymbolType["MultiplicationAssignment"] = 50] = "MultiplicationAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["DivisionAssignment"] = 51] = "DivisionAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["ModuloAssignment"] = 52] = "ModuloAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["AdditionAssignment"] = 53] = "AdditionAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["SubtractionAssignment"] = 54] = "SubtractionAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseLeftShiftAssignment"] = 55] = "BitwiseLeftShiftAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseRightShiftAssignment"] = 56] = "BitwiseRightShiftAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseUnsignedRightShiftAssignment"] = 57] = "BitwiseUnsignedRightShiftAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseAndAssignment"] = 58] = "BitwiseAndAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseOrAssignment"] = 59] = "BitwiseOrAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["BitwiseXorAssignment"] = 60] = "BitwiseXorAssignment";
                JavaScriptSymbolType[JavaScriptSymbolType["Comma"] = 61] = "Comma";
                JavaScriptSymbolType[JavaScriptSymbolType["DoubleQuote"] = 62] = "DoubleQuote";
                JavaScriptSymbolType[JavaScriptSymbolType["SingleQuote"] = 63] = "SingleQuote";
                JavaScriptSymbolType[JavaScriptSymbolType["Backslash"] = 64] = "Backslash";
                JavaScriptSymbolType[JavaScriptSymbolType["Semicolon"] = 65] = "Semicolon";
                JavaScriptSymbolType[JavaScriptSymbolType["RazorCommentTransition"] = 66] = "RazorCommentTransition";
                JavaScriptSymbolType[JavaScriptSymbolType["RazorCommentStar"] = 67] = "RazorCommentStar";
                JavaScriptSymbolType[JavaScriptSymbolType["RazorComment"] = 68] = "RazorComment";
            })(Symbols.JavaScriptSymbolType || (Symbols.JavaScriptSymbolType = {}));
            var JavaScriptSymbolType = Symbols.JavaScriptSymbolType;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="SymbolBase.ts" />
/// <reference path="JavaScriptSymbolType.ts" />
/// <reference path="JavaScriptKeyword.ts" />
/// <reference path="../../SourceLocation.ts" />
/// <reference path="../../RazorError.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var Symbols;
        (function (Symbols) {
            var JavaScriptSymbol = (function (_super) {
                __extends(JavaScriptSymbol, _super);
                function JavaScriptSymbol(start, content, type, errors, keyword) {
                    _super.call(this, start, content, type, errors || []);
                    this.keyword = keyword || null;
                }
                Object.defineProperty(JavaScriptSymbol.prototype, "runtimeTypeName", {
                    get: function () {
                        return "JavaScriptSymbol";
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(JavaScriptSymbol.prototype, "typeName", {
                    get: function () {
                        return Symbols.JavaScriptSymbolType[this.type];
                    },
                    enumerable: true,
                    configurable: true
                });
                JavaScriptSymbol.prototype.equals = function (other) {
                    if (!other) {
                        return false;
                    }
                    if (!(other instanceof JavaScriptSymbol)) {
                        return false;
                    }
                    return _super.prototype.equals.call(this, other) &&
                        this.keyword === other.keyword;
                };
                return JavaScriptSymbol;
            })(Symbols.SymbolBase);
            Symbols.JavaScriptSymbol = JavaScriptSymbol;
        })(Symbols = Tokenizer.Symbols || (Tokenizer.Symbols = {}));
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="Symbols/JavaScriptSymbolType.ts" />
/// <reference path="Symbols/JavaScriptSymbol.ts" />
/// <reference path="Symbols/JavaScriptSymbolType.ts" />
/// <reference path="Tokenizer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
/// <reference path="../Text/SeekableTextReader.ts" />
/// <reference path="../Internals/Using.ts" />
/// <reference path="../RazorError.ts" />
/// <reference path="../Parser/ParserHelpers.ts" />
/// <reference path="JavaScriptKeywordDetector.ts" />
/// <reference path="JavaScriptHelpers.ts" />"
/// <reference path="OperatorHandler.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var JavaScriptSymbol = Razor.Tokenizer.Symbols.JavaScriptSymbol;
        var JavaScriptSymbolType = Razor.Tokenizer.Symbols.JavaScriptSymbolType;
        var ParserHelpers = Razor.Parser.ParserHelpers;
        var JavaScriptHelpers = Razor.Tokenizer.JavaScriptHelpers;
        var JavaScriptKeywordDetector = Razor.Tokenizer.JavaScriptKeywordDetector;
        var using = Razor.Using;
        var RazorError = Razor.RazorError;
        var transitionChar = '@';
        var JavaScriptTokenizer = (function (_super) {
            __extends(JavaScriptTokenizer, _super);
            function JavaScriptTokenizer(source) {
                _super.call(this, source);
                this._operatorHandlers = {};
                this.currentState = this.data;
                this._operatorHandlers =
                    {
                        '.': function () { return JavaScriptSymbolType.Dot; },
                        '[': function () { return JavaScriptSymbolType.LeftBracket; },
                        ']': function () { return JavaScriptSymbolType.RightBracket; },
                        '(': function () { return JavaScriptSymbolType.LeftParen; },
                        ')': function () { return JavaScriptSymbolType.RightParen; },
                        '{': function () { return JavaScriptSymbolType.LeftBrace; },
                        '}': function () { return JavaScriptSymbolType.RightBrace; },
                        '?': function () { return JavaScriptSymbolType.QuestionMark; },
                        ':': function () { return JavaScriptSymbolType.Colon; },
                        ',': function () { return JavaScriptSymbolType.Comma; },
                        "'": function () { return JavaScriptSymbolType.SingleQuote; },
                        '"': function () { return JavaScriptSymbolType.DoubleQuote; },
                        '\\': function () { return JavaScriptSymbolType.Backslash; },
                        ';': function () { return JavaScriptSymbolType.Semicolon; },
                        '~': function () { return JavaScriptSymbolType.BitwiseNot; },
                        '+': this.createTwoCharOperatorHandler(JavaScriptSymbolType.Plus, '+', JavaScriptSymbolType.Increment, '=', JavaScriptSymbolType.AdditionAssignment),
                        '-': this.createTwoCharOperatorHandler(JavaScriptSymbolType.Minus, '-', JavaScriptSymbolType.Decrement, '=', JavaScriptSymbolType.SubtractionAssignment),
                        '%': this.createTwoCharOperatorHandler(JavaScriptSymbolType.Modulo, '=', JavaScriptSymbolType.ModuloAssignment),
                        '!': this.bangOperator,
                        '/': this.createTwoCharOperatorHandler(JavaScriptSymbolType.Divide, '=', JavaScriptSymbolType.DivisionAssignment),
                        '*': this.createTwoCharOperatorHandler(JavaScriptSymbolType.Multiply, '*', JavaScriptSymbolType.Exponentiation, '=', JavaScriptSymbolType.MultiplicationAssignment),
                        '<': this.lessThanOperator,
                        '>': this.greaterThanOperator,
                        '=': this.equalityOperator,
                        '&': this.createTwoCharOperatorHandler(JavaScriptSymbolType.BitwiseAnd, '&', JavaScriptSymbolType.LogicalAnd, '=', JavaScriptSymbolType.BitwiseAndAssignment),
                        '|': this.createTwoCharOperatorHandler(JavaScriptSymbolType.BitwiseOr, '|', JavaScriptSymbolType.LogicalOr, '=', JavaScriptSymbolType.BitwiseOrAssignment),
                        '^': this.createTwoCharOperatorHandler(JavaScriptSymbolType.BitwiseXor, '=', JavaScriptSymbolType.BitwiseXorAssignment)
                    };
            }
            Object.defineProperty(JavaScriptTokenizer.prototype, "startState", {
                get: function () {
                    return this.data;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(JavaScriptTokenizer.prototype, "razorCommentStarType", {
                get: function () { return JavaScriptSymbolType.RazorCommentStar; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(JavaScriptTokenizer.prototype, "razorCommentType", {
                get: function () { return JavaScriptSymbolType.RazorComment; },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(JavaScriptTokenizer.prototype, "razorCommentTransitionType", {
                get: function () { return JavaScriptSymbolType.RazorCommentTransition; },
                enumerable: true,
                configurable: true
            });
            JavaScriptTokenizer.prototype.atSymbol = function () {
                var _this = this;
                this.takeCurrent();
                if (this.currentCharacter === '*') {
                    return this.transition(this.endSymbol(JavaScriptSymbolType.RazorCommentTransition), this.afterRazorCommentTransition);
                }
                else if (this.currentCharacter === '@') {
                    return this.transition(this.endSymbol(JavaScriptSymbolType.Transition), (function () {
                        _this.takeCurrent();
                        return _this.transition(_this.endSymbol(JavaScriptSymbolType.Transition), _this.data);
                    }));
                }
                return this.stay(this.endSymbol(JavaScriptSymbolType.Transition));
            };
            JavaScriptTokenizer.prototype.bangOperator = function () {
                if (this.currentCharacter === '=') {
                    this.takeCurrent();
                    if (this.currentCharacter === '=') {
                        this.takeCurrent();
                        return JavaScriptSymbolType.StrictNotEqual;
                    }
                    return JavaScriptSymbolType.NotEqual;
                }
                return JavaScriptSymbolType.LogicalNot;
            };
            JavaScriptTokenizer.prototype.binaryLiteral = function () {
                this.takeUntil(function (c) { return !ParserHelpers.isBinaryDigit(c); });
                return this.stay(this.endSymbol(JavaScriptSymbolType.BinaryLiteral));
            };
            JavaScriptTokenizer.prototype.blockComment = function () {
                this.takeUntil(function (c) { return c === '*'; });
                if (this.endOfFile) {
                    this.currentErrors.push(new RazorError('Untermined block comment', this.currentStart, 1));
                    return this.transition(this.endSymbol(JavaScriptSymbolType.Comment), this.data);
                }
                if (this.currentCharacter === '*') {
                    this.takeCurrent();
                    if (this.currentCharacter === '/') {
                        this.takeCurrent();
                        return this.transition(this.endSymbol(JavaScriptSymbolType.Comment), this.data);
                    }
                }
                return this.stay();
            };
            JavaScriptTokenizer.prototype.createTwoCharOperatorHandler = function (typeIfOnlyFirst, option1, typeIfOption1, option2, typeIfOption2) {
                var _this = this;
                return (function () {
                    if (!!option1 && _this.currentCharacter === option1) {
                        _this.takeCurrent();
                        return typeIfOption1;
                    }
                    else if (!!option2 && _this.currentCharacter === option2) {
                        _this.takeCurrent();
                        return typeIfOption2;
                    }
                    return typeIfOnlyFirst;
                });
            };
            JavaScriptTokenizer.prototype.createSymbol = function (start, content, type, errors) {
                return new JavaScriptSymbol(start, content, type, errors);
            };
            JavaScriptTokenizer.prototype.data = function () {
                var _this = this;
                if (ParserHelpers.isNewLine(this.currentCharacter)) {
                    var check = (this.currentCharacter === '\r');
                    this.takeCurrent();
                    if (check && this.currentCharacter === '\n') {
                        this.takeCurrent();
                    }
                    return this.stay(this.endSymbol(JavaScriptSymbolType.NewLine));
                }
                else if (ParserHelpers.isWhiteSpace(this.currentCharacter)) {
                    this.takeUntil(function (c) { return !ParserHelpers.isWhiteSpace(c); });
                    return this.stay(this.endSymbol(JavaScriptSymbolType.WhiteSpace));
                }
                else if (JavaScriptHelpers.isIdentifierStart(this.currentCharacter)) {
                    return this.identifier();
                }
                else if (ParserHelpers.isDecimalDigit(this.currentCharacter)) {
                    return this.numericLiteral();
                }
                switch (this.currentCharacter) {
                    case '@': return this.atSymbol();
                    case '\'':
                        {
                            this.takeCurrent();
                            return this.transition((function () { return _this.quotedLiteral('\''); }));
                        }
                    case '"':
                        {
                            this.takeCurrent();
                            return this.transition((function () { return _this.quotedLiteral('"'); }));
                        }
                    case '.':
                        {
                            if (ParserHelpers.isDecimalDigit(this.peek())) {
                                return this.realLiteral();
                            }
                            return this.stay(this.single(JavaScriptSymbolType.Dot));
                        }
                    case '/':
                        {
                            return this.solidus();
                        }
                    default:
                        {
                            return this.stay(this.endSymbol(this.operator()));
                        }
                }
            };
            JavaScriptTokenizer.prototype.decimalLiteral = function () {
                this.takeUntil(function (c) { return !ParserHelpers.isDecimalDigit(c); });
                if (this.currentCharacter === '.' && ParserHelpers.isDecimalDigit(this.peek())) {
                    return this.realLiteral();
                }
                else if (this.currentCharacter === 'E' || this.currentCharacter === 'e') {
                    return this.realLiteralExponentPart();
                }
                else {
                    return this.stay(this.endSymbol(JavaScriptSymbolType.IntegerlLiteral));
                }
            };
            JavaScriptTokenizer.prototype.equalityOperator = function () {
                if (this.currentCharacter === '=') {
                    this.takeCurrent();
                    if (this.currentCharacter === '=') {
                        this.takeCurrent();
                        return JavaScriptSymbolType.StrictEqual;
                    }
                    return JavaScriptSymbolType.Equal;
                }
                return JavaScriptSymbolType.Assignment;
            };
            JavaScriptTokenizer.prototype.greaterThanOperator = function () {
                if (this.currentCharacter === '=') {
                    this.takeCurrent();
                    return JavaScriptSymbolType.GreaterThenEqualTo;
                }
                else if (this.currentCharacter === '>') {
                    this.takeCurrent();
                    if (this.currentCharacter === '=') {
                        this.takeCurrent();
                        return JavaScriptSymbolType.BitwiseRightShiftAssignment;
                    }
                    else if (this.currentCharacter === '>') {
                        this.takeCurrent();
                        if (this.currentCharacter === '=') {
                            this.takeCurrent();
                            return JavaScriptSymbolType.BitwiseUnsignedRightShiftAssignment;
                        }
                        return JavaScriptSymbolType.BitwiseUnsignedRightShift;
                    }
                    return JavaScriptSymbolType.BitwiseRightShift;
                }
                return JavaScriptSymbolType.GreaterThan;
            };
            JavaScriptTokenizer.prototype.hexLiteral = function () {
                this.takeUntil(function (c) { return !ParserHelpers.isHexDigit(c); });
                return this.stay(this.endSymbol(JavaScriptSymbolType.HexLiteral));
            };
            JavaScriptTokenizer.prototype.identifier = function () {
                this.takeCurrent();
                this.takeUntil(function (c) { return !JavaScriptHelpers.isIdentifierPart(c); });
                var sym = null;
                if (this.haveContent) {
                    var kwd = JavaScriptKeywordDetector.symbolTypeForIdentifier(this.buffer.toString());
                    var type = JavaScriptSymbolType.Identifier;
                    if (kwd !== null) {
                        type = JavaScriptSymbolType.Keyword;
                    }
                    sym = new JavaScriptSymbol(this.currentStart, this.buffer.toString(), type, null, kwd);
                }
                this.startSymbol();
                return this.stay(sym);
            };
            JavaScriptTokenizer.prototype.lessThanOperator = function () {
                if (this.currentCharacter === '<') {
                    this.takeCurrent();
                    if (this.currentCharacter === '=') {
                        this.takeCurrent();
                        return JavaScriptSymbolType.BitwiseLeftShiftAssignment;
                    }
                    return JavaScriptSymbolType.BitwiseLeftShift;
                }
                else if (this.currentCharacter === '=') {
                    this.takeCurrent();
                    return JavaScriptSymbolType.LessThanEqualTo;
                }
                return JavaScriptSymbolType.LessThan;
            };
            JavaScriptTokenizer.prototype.numericLiteral = function () {
                if (this.takeAll('0x', true)) {
                    return this.hexLiteral();
                }
                else if (this.takeAll('0b', true)) {
                    return this.binaryLiteral();
                }
                else if (this.takeAll('0o', true)) {
                    return this.octalLiteral();
                }
                return this.decimalLiteral();
            };
            JavaScriptTokenizer.prototype.octalLiteral = function () {
                this.takeUntil(function (c) { return !ParserHelpers.isOctalDigit(c); });
                return this.stay(this.endSymbol(JavaScriptSymbolType.OctalLiteral));
            };
            JavaScriptTokenizer.prototype.operator = function () {
                var first = this.currentCharacter, handler = this._operatorHandlers[first];
                this.takeCurrent();
                if (!!handler) {
                    return handler.apply(this, [first]);
                }
                return JavaScriptSymbolType.Unknown;
            };
            JavaScriptTokenizer.prototype.quotedLiteral = function (quote) {
                this.takeUntil(function (c) { return c === '\\' || c === quote || ParserHelpers.isNewLine(c); });
                if (this.currentCharacter === '\\') {
                    this.takeCurrent();
                    if (this.currentCharacter === quote || this.currentCharacter === '\\') {
                        this.takeCurrent();
                    }
                    return this.stay();
                }
                else if (this.endOfFile || ParserHelpers.isNewLine(this.currentCharacter)) {
                    this.currentErrors.push(new RazorError('Unterminated string literal', this.currentStart, 1));
                }
                else {
                    this.takeCurrent();
                }
                return this.transition(this.endSymbol(JavaScriptSymbolType.StringLiteral), this.data);
            };
            JavaScriptTokenizer.prototype.realLiteral = function () {
                this.takeCurrent();
                this.takeUntil(function (c) { return !ParserHelpers.isDecimalDigit(c); });
                return this.realLiteralExponentPart();
            };
            JavaScriptTokenizer.prototype.realLiteralExponentPart = function () {
                if (this.currentCharacter === 'E' || this.currentCharacter === 'e') {
                    this.takeCurrent();
                    if (this.currentCharacter === '+' || this.currentCharacter === '-') {
                        this.takeCurrent();
                    }
                    this.takeUntil(function (c) { return !ParserHelpers.isDecimalDigit(c); });
                }
                return this.stay(this.endSymbol(JavaScriptSymbolType.RealLiteral));
            };
            JavaScriptTokenizer.prototype.regularExpressionLiteral = function () {
                var _this = this;
                var oldBuffer = this.buffer.toString();
                var lookahead = this.source.beginLookahead();
                var found = false;
                using(lookahead, function () {
                    _this.takeCurrent();
                    if (_this.currentCharacter === '/' || _this.currentCharacter === '*') {
                        return;
                    }
                    while (!_this.endOfFile) {
                        if (ParserHelpers.isNewLine(_this.currentCharacter)) {
                            break;
                        }
                        _this.takeCurrent();
                        if (_this.currentCharacter === '/') {
                            _this.takeCurrent();
                            while (/[igmy]/.test(_this.currentCharacter)) {
                                _this.takeCurrent();
                            }
                            found = true;
                            lookahead.accept();
                            break;
                        }
                    }
                });
                if (!found) {
                    this.buffer.clear();
                    this.buffer.append(oldBuffer);
                }
                return found;
            };
            JavaScriptTokenizer.prototype.singleLineComment = function () {
                this.takeUntil(function (c) { return ParserHelpers.isNewLine(c); });
                return this.stay(this.endSymbol(JavaScriptSymbolType.Comment));
            };
            JavaScriptTokenizer.prototype.solidus = function () {
                if (this.regularExpressionLiteral()) {
                    return this.stay(this.endSymbol(JavaScriptSymbolType.RegularExpressionLiteral));
                }
                if (this.peek() === '/') {
                    this.takeCurrent();
                    this.takeCurrent();
                    return this.singleLineComment();
                }
                else if (this.peek() === '*') {
                    this.takeCurrent();
                    this.takeCurrent();
                    return this.transition(this.blockComment);
                }
                return this.stay(this.endSymbol(this.operator()));
            };
            return JavaScriptTokenizer;
        })(Tokenizer.Tokenizer);
        Tokenizer.JavaScriptTokenizer = JavaScriptTokenizer;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
/// <reference path="Symbols/ISymbol.ts" />
/// <reference path="ITokenizer.ts" />
/// <reference path="../Text/ITextDocument.ts" />
var Razor;
(function (Razor) {
    var Tokenizer;
    (function (Tokenizer) {
        var TokenizerView = (function () {
            function TokenizerView(tokenizer) {
                this._tokenizer = tokenizer;
            }
            Object.defineProperty(TokenizerView.prototype, "current", {
                get: function () {
                    return this._current;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TokenizerView.prototype, "endOfFile", {
                get: function () {
                    return this._endOfFile;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TokenizerView.prototype, "source", {
                get: function () {
                    return this.tokenizer.sourceDocument;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TokenizerView.prototype, "tokenizer", {
                get: function () {
                    return this._tokenizer;
                },
                enumerable: true,
                configurable: true
            });
            TokenizerView.prototype.next = function () {
                this._current = this.tokenizer.nextSymbol();
                this._endOfFile = !this._current;
                return !this._endOfFile;
            };
            TokenizerView.prototype.putBack = function (symbol) {
                if (this.source.position !== symbol.start.absoluteIndex + symbol.content.length) {
                    throw "Unable to put symbol back as we've already moved passed this symbol.";
                }
                this.source.position -= symbol.content.length;
                this._current = null;
                this._endOfFile = this.source.position >= this.source.length;
                this.tokenizer.reset();
            };
            return TokenizerView;
        })();
        Tokenizer.TokenizerView = TokenizerView;
    })(Tokenizer = Razor.Tokenizer || (Razor.Tokenizer = {}));
})(Razor || (Razor = {}));
//# sourceMappingURL=razor.js.map