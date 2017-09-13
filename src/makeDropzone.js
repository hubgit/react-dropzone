import React from 'react'
import Dropzone from './Dropzone'
import { supportMultiple, allFilesAccepted } from './utils'

const makeDropzone = options => WrappedComponent =>
  class extends Dropzone {
    buildComponentProps = () => {
      const { multiple } = this.props
      const { acceptedFiles, draggedFiles, rejectedFiles, isDragActive } = this.state

      const filesCount = draggedFiles.length
      const isMultipleAllowed = multiple || filesCount <= 1
      const isDragAccept = filesCount > 0 && allFilesAccepted(draggedFiles, this.props.accept)
      const isDragReject = filesCount > 0 && (!isDragAccept || !isMultipleAllowed)

      return {
        acceptedFiles,
        draggedFiles,
        rejectedFiles,
        isDragActive,
        isDragAccept,
        isDragReject
      }
    }

    buildInputProps = () => {
      const { accept, disabled, multiple, name } = this.props

      const props = {
        accept,
        disabled,
        type: 'file',
        style: { display: 'none' },
        multiple: supportMultiple && multiple,
        ref: this.setRefs,
        onChange: this.onDrop,
        autoComplete: 'off'
      }

      if (name && name.length) {
        props.name = name
      }

      return props
    }

    buildHandlers = () => {
      if (this.props.disabled) return {}

      const { onClick, onDragStart, onDragEnter, onDragOver, onDragLeave, onDrop } = this

      return { onClick, onDragStart, onDragEnter, onDragOver, onDragLeave, onDrop }
    }

    render() {
      const { disabled } = this.props

      return (
        <div {...this.buildHandlers()} ref={this.setRef} aria-disabled={disabled}>
          <WrappedComponent {...this.props} {...this.buildComponentProps()} />
          <input {...options.inputProps} {...this.buildInputProps()} />
        </div>
      )
    }
  }

export default makeDropzone
