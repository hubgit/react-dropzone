import React from 'react'
import Dropzone from './Dropzone'
import { supportMultiple, allFilesAccepted } from './utils'

const makeDropzone = WrappedComponent =>
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

    render() {
      const { accept, disabled, inputProps, multiple, name } = this.props

      const inputAttributes = {
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
        inputAttributes.name = name
      }

      return (
        <div
          onClick={this.composeHandlers(this.onClick)}
          onDragStart={this.composeHandlers(this.onDragStart)}
          onDragEnter={this.composeHandlers(this.onDragEnter)}
          onDragOver={this.composeHandlers(this.onDragOver)}
          onDragLeave={this.composeHandlers(this.onDragLeave)}
          onDrop={this.composeHandlers(this.onDrop)}
          ref={this.setRef}
          aria-disabled={disabled}
        >
          <WrappedComponent {...this.buildComponentProps()} />
          <input
            {...inputProps /* expand user provided inputProps first so inputAttributes override them */}
            {...inputAttributes}
          />
        </div>
      )
    }
  }

export default makeDropzone
