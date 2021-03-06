Object.assign(pc, function () {
    'use strict';

    function VertexIteratorAccessor(buffer, vertexElement, vertexFormat) {
        this.index = 0;
        this.numComponents = vertexElement.numComponents;

        // map only section of underlaying buffer for non-interleaved format
        var bufferLength;
        if (!vertexFormat.interleaved)
            bufferLength = vertexFormat.vertexCount * vertexElement.numComponents;

        switch (vertexElement.dataType) {
            case pc.TYPE_INT8:
                this.array = new Int8Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_UINT8:
                this.array = new Uint8Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_INT16:
                this.array = new Int16Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_UINT16:
                this.array = new Uint16Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_INT32:
                this.array = new Int32Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_UINT32:
                this.array = new Uint32Array(buffer, vertexElement.offset, bufferLength);
                break;
            case pc.TYPE_FLOAT32:
                this.array = new Float32Array(buffer, vertexElement.offset, bufferLength);
                break;
        }

        // BYTES_PER_ELEMENT is on the instance and constructor for Chrome, Safari and Firefox, but just the constructor for Opera
        this.stride = vertexElement.stride / this.array.constructor.BYTES_PER_ELEMENT;

        // Methods
        switch (vertexElement.numComponents) {
            case 1:
                this.set = VertexIteratorAccessor_set1;
                this.getToArray = VertexIteratorAccessor_arrayGet1;
                this.setFromArray = VertexIteratorAccessor_arraySet1;
                break;

            case 2:
                this.set = VertexIteratorAccessor_set2;
                this.getToArray = VertexIteratorAccessor_arrayGet2;
                this.setFromArray = VertexIteratorAccessor_arraySet2;
                break;

            case 3:
                this.set = VertexIteratorAccessor_set3;
                this.getToArray = VertexIteratorAccessor_arrayGet3;
                this.setFromArray = VertexIteratorAccessor_arraySet3;
                break;

            case 4:
                this.set = VertexIteratorAccessor_set4;
                this.getToArray = VertexIteratorAccessor_arrayGet4;
                this.setFromArray = VertexIteratorAccessor_arraySet4;
                break;
        }
    }

    VertexIteratorAccessor.prototype.get = function (offset) {
        return this.array[this.index + offset];
    };

    function VertexIteratorAccessor_set1(a) {
        this.array[this.index] = a;
    }

    function VertexIteratorAccessor_set2(a, b) {
        this.array[this.index] = a;
        this.array[this.index + 1] = b;
    }

    function VertexIteratorAccessor_set3(a, b, c) {
        this.array[this.index] = a;
        this.array[this.index + 1] = b;
        this.array[this.index + 2] = c;
    }

    function VertexIteratorAccessor_set4(a, b, c, d) {
        this.array[this.index] = a;
        this.array[this.index + 1] = b;
        this.array[this.index + 2] = c;
        this.array[this.index + 3] = d;
    }

    function VertexIteratorAccessor_arraySet1(index, inputArray, inputIndex) {
        this.array[index] = inputArray[inputIndex];
    }

    function VertexIteratorAccessor_arraySet2(index, inputArray, inputIndex) {
        this.array[index] = inputArray[inputIndex];
        this.array[index + 1] = inputArray[inputIndex + 1];
    }

    function VertexIteratorAccessor_arraySet3(index, inputArray, inputIndex) {
        this.array[index] = inputArray[inputIndex];
        this.array[index + 1] = inputArray[inputIndex + 1];
        this.array[index + 2] = inputArray[inputIndex + 2];
    }

    function VertexIteratorAccessor_arraySet4(index, inputArray, inputIndex) {
        this.array[index] = inputArray[inputIndex];
        this.array[index + 1] = inputArray[inputIndex + 1];
        this.array[index + 2] = inputArray[inputIndex + 2];
        this.array[index + 3] = inputArray[inputIndex + 3];
    }

    function VertexIteratorAccessor_arrayGet1(offset, outputArray, outputIndex) {
        outputArray[outputIndex] = this.array[offset];
    }

    function VertexIteratorAccessor_arrayGet2(offset, outputArray, outputIndex) {
        outputArray[outputIndex] = this.array[offset];
        outputArray[outputIndex + 1] = this.array[offset + 1];
    }

    function VertexIteratorAccessor_arrayGet3(offset, outputArray, outputIndex) {
        outputArray[outputIndex] = this.array[offset];
        outputArray[outputIndex + 1] = this.array[offset + 1];
        outputArray[outputIndex + 2] = this.array[offset + 2];
    }

    function VertexIteratorAccessor_arrayGet4(offset, outputArray, outputIndex) {
        outputArray[outputIndex] = this.array[offset];
        outputArray[outputIndex + 1] = this.array[offset + 1];
        outputArray[outputIndex + 2] = this.array[offset + 2];
        outputArray[outputIndex + 3] = this.array[offset + 3];
    }

    /**
     * @class
     * @name pc.VertexIterator
     * @classdesc A vertex iterator simplifies the process of writing vertex data to a vertex buffer.
     * @description Returns a new pc.VertexIterator object.
     * @param {pc.VertexBuffer} vertexBuffer - The vertex buffer to be iterated.
     * @property {object} element The vertex buffer elements.
     */
    function VertexIterator(vertexBuffer) {
        // Store the vertex buffer
        this.vertexBuffer = vertexBuffer;
        this.vertexFormatSize = vertexBuffer.getFormat().size;

        // Lock the vertex buffer
        this.buffer = this.vertexBuffer.lock();

        // Create an empty list
        this.accessors = [];
        this.element = {};

        // Add a new 'setter' function for each element
        var vertexFormat = this.vertexBuffer.getFormat();
        for (var i = 0; i < vertexFormat.elements.length; i++) {
            var vertexElement = vertexFormat.elements[i];
            this.accessors[i] = new VertexIteratorAccessor(this.buffer, vertexElement, vertexFormat);
            this.element[vertexElement.name] = this.accessors[i];
        }
    }

    Object.assign(VertexIterator.prototype, {
        /**
         * @function
         * @name pc.VertexIterator#next
         * @description Moves the vertex iterator on to the next vertex.
         * @param {number} [count] - Optional number of steps to move on when calling next, defaults to 1.
         * @example
         * var iterator = new pc.VertexIterator(vertexBuffer);
         * iterator.element[pc.SEMANTIC_POSTIION].set(-0.9, -0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(255, 0, 0, 255);
         * iterator.next();
         * iterator.element[pc.SEMANTIC_POSTIION].set(0.9, -0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(0, 255, 0, 255);
         * iterator.next();
         * iterator.element[pc.SEMANTIC_POSTIION].set(0.0, 0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(0, 0, 255, 255);
         * iterator.end();
         */
        next: function (count) {
            if (count === undefined) count = 1;

            var i = 0;
            var accessors = this.accessors;
            var numAccessors = this.accessors.length;
            while (i < numAccessors) {
                var accessor = accessors[i++];
                accessor.index += count * accessor.stride;
            }
        },

        /**
         * @function
         * @name pc.VertexIterator#end
         * @description Notifies the vertex buffer being iterated that writes are complete. Internally
         * the vertex buffer is unlocked and vertex data is uploaded to video memory.
         * @example
         * var iterator = new pc.VertexIterator(vertexBuffer);
         * iterator.element[pc.SEMANTIC_POSTIION].set(-0.9, -0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(255, 0, 0, 255);
         * iterator.next();
         * iterator.element[pc.SEMANTIC_POSTIION].set(0.9, -0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(0, 255, 0, 255);
         * iterator.next();
         * iterator.element[pc.SEMANTIC_POSTIION].set(0.0, 0.9, 0.0);
         * iterator.element[pc.SEMANTIC_COLOR].set(0, 0, 255, 255);
         * iterator.end();
         */
        end: function () {
            // Unlock the vertex buffer
            this.vertexBuffer.unlock();
            this.vertexBuffer = null;
        },

        // Copies data for specified semantic into vertex buffer.
        // Works with both interleaved (slower) and non-interleaved (fast) vertex buffer
        writeData: function (semantic, data, numVertices) {
            var element = this.element[semantic];
            if (element) {

                if (numVertices > this.vertexBuffer.numVertices) {
                    // #ifdef DEBUG
                    console.error("NumVertices provided to setData: " + numVertices + " is larger than space in VertexBuffer: " + this.vertexBuffer.numVertices);
                    // #endif

                    // avoid overwrite
                    numVertices = this.vertexBuffer.numVertices;
                }

                var i, numComponents = element.numComponents;

                // copy data to interleaved buffer by looping over vertices and copying them manually
                if (this.vertexBuffer.getFormat().interleaved) {
                    var index = 0;
                    for (i = 0; i < numVertices; i++) {
                        element.setFromArray(index, data, i * numComponents);
                        index += element.stride;
                    }
                } else {    // non-interleaved copy

                    // if data contains more  data than needed, copy from its subarray
                    if (data.length > numVertices * numComponents) {
                        var copyCount = numVertices * numComponents;

                        // if data is typed array
                        if (ArrayBuffer.isView(data)) {
                            data = data.subarray(0, copyCount);
                            element.array.set(data);
                        } else {
                            // data is array, copy right amount manually
                            for (i = 0; i < copyCount; i++)
                                element.array[i] = data[i];
                        }
                    } else {
                        // copy whole data
                        element.array.set(data);
                    }
                }
            }
        },

        // Function to extract elements of a specified semantic from vertex buffer into flat array (data).
        // Works with both interleaved (slower) and non-interleaved (fast) vertex buffer
        // returns number of verticies
        // Note: when data is typed array and is smaller than needed, only part of data gets copied out (typed arrays ignore read/write out of range)
        readData: function (semantic, data) {
            var element = this.element[semantic];
            var count = 0;
            if (element) {
                count = this.vertexBuffer.numVertices;
                var i;

                if (this.vertexBuffer.getFormat().interleaved) {

                    // extract data from interleaved buffer by looping over vertices and copying them manually
                    var numComponents = element.numComponents;
                    data.length = 0;
                    element.index = 0;
                    var offset = 0;
                    for (i = 0; i < count; i++) {
                        element.getToArray(offset, data, i * numComponents);
                        offset += element.stride;
                    }
                } else {
                    if (ArrayBuffer.isView(data.buffer)) {
                        // destination data is typed array
                        data.set(element.array);
                    } else {
                        // destination data is array
                        data.length = 0;
                        for (i = 0; i < count; i++)
                            data[i] = element.array[i];
                    }
                }
            }

            return count;
        }
    });

    return {
        VertexIterator: VertexIterator
    };
}());
