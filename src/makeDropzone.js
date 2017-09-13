import React from 'react'
import {
  supportMultiple,
  fileAccepted,
  allFilesAccepted,
  fileMatchSize,
  onDocumentDragOver,
  getDataTransferItems
} from './utils'

const makeDropzone = options => WrappedComponent =>
  class extends React.Component {
    state = {
      isFileDialogActive: false,
      draggedFiles: [],
      acceptedFiles: [],
      rejectedFiles: []
    }

    componentDidMount() {
      const { preventDropOnDocument } = options
      this.dragTargets = []

      if (preventDropOnDocument) {
        document.addEventListener('dragover', onDocumentDragOver, false)
        document.addEventListener('drop', this.onDocumentDrop, false)
      }
      this.fileInputEl.addEventListener('click', this.onInputElementClick, false)
      // Tried implementing addEventListener, but didn't work out
      document.body.onfocus = this.onFileDialogCancel
    }

    componentWillUnmount() {
      const { preventDropOnDocument } = options
      if (preventDropOnDocument) {
        document.removeEventListener('dragover', onDocumentDragOver)
        document.removeEventListener('drop', this.onDocumentDrop)
      }
      this.fileInputEl.removeEventListener('click', this.onInputElementClick, false)
      // Can be replaced with removeEventListener, if addEventListener works
      document.body.onfocus = null
    }

    onDocumentDrop = evt => {
      if (this.node.contains(evt.target)) {
        // if we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
        return
      }
      evt.preventDefault()
      this.dragTargets = []
    }

    onDragStart = evt => {
      if (options.onDragStart) {
        options.onDragStart.call(this, evt)
      }
    }

    onDragEnter = evt => {
      evt.preventDefault()

      // Count the dropzone and any children that are entered.
      if (this.dragTargets.indexOf(evt.target) === -1) {
        this.dragTargets.push(evt.target)
      }

      this.setState({
        isDragActive: true, // Do not rely on files for the drag state. It doesn't work in Safari.
        draggedFiles: getDataTransferItems(evt)
      })

      if (options.onDragEnter) {
        options.onDragEnter.call(this, evt)
      }
    }

    onDragOver = evt => {
      evt.preventDefault()
      evt.stopPropagation()
      try {
        evt.dataTransfer.dropEffect = 'copy' // eslint-disable-line no-param-reassign
      } catch (err) {
        // continue regardless of error
      }

      if (options.onDragOver) {
        options.onDragOver.call(this, evt)
      }
      return false
    }

    onDragLeave = evt => {
      evt.preventDefault()

      // Only deactivate once the dropzone and all children have been left.
      this.dragTargets = this.dragTargets.filter(el => el !== evt.target && this.node.contains(el))
      if (this.dragTargets.length > 0) {
        return
      }

      // Clear dragging files state
      this.setState({
        isDragActive: false,
        draggedFiles: []
      })

      if (options.onDragLeave) {
        options.onDragLeave.call(this, evt)
      }
    }

    onDrop = evt => {
      const { onDrop, onDropAccepted, onDropRejected, multiple, disablePreview, accept } = options
      const fileList = getDataTransferItems(evt)
      const acceptedFiles = []
      const rejectedFiles = []

      // Stop default browser behavior
      evt.preventDefault()

      // Reset the counter along with the drag on a drop.
      this.dragTargets = []
      this.setState({
        isFileDialogActive: false
      })

      fileList.forEach(file => {
        if (!disablePreview) {
          try {
            file.preview = window.URL.createObjectURL(file) // eslint-disable-line no-param-reassign
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Failed to generate preview for file', file, err) // eslint-disable-line no-console
            }
          }
        }

        if (fileAccepted(file, accept) && fileMatchSize(file, options.maxSize, options.minSize)) {
          acceptedFiles.push(file)
        } else {
          rejectedFiles.push(file)
        }
      })

      if (!multiple) {
        // if not in multi mode add any extra accepted files to rejected.
        // This will allow end users to easily ignore a multi file drop in "single" mode.
        rejectedFiles.push(...acceptedFiles.splice(1))
      }

      if (onDrop) {
        onDrop.call(this, acceptedFiles, rejectedFiles, evt)
      }

      if (rejectedFiles.length > 0 && onDropRejected) {
        onDropRejected.call(this, rejectedFiles, evt)
      }

      if (acceptedFiles.length > 0 && onDropAccepted) {
        onDropAccepted.call(this, acceptedFiles, evt)
      }

      // Clear files value
      this.draggedFiles = null

      // Reset drag state
      this.setState({
        isDragActive: false,
        draggedFiles: [],
        acceptedFiles,
        rejectedFiles
      })
    }

    onClick = evt => {
      const { onClick, disableClick } = options
      if (!disableClick) {
        evt.stopPropagation()

        if (onClick) {
          onClick.call(this, evt)
        }

        // in IE11/Edge the file-browser dialog is blocking, ensure this is behind setTimeout
        // this is so react can handle state changes in the onClick prop above above
        // see: https://github.com/react-dropzone/react-dropzone/issues/450
        setTimeout(this.open, 0)
      }
    }

    // eslint-disable-next-line class-methods-use-this
    onInputElementClick = evt => {
      evt.stopPropagation()
      const { inputProps } = options

      if (inputProps && inputProps.onClick) {
        inputProps.onClick()
      }
    }

    onFileDialogCancel = () => {
      // timeout will not recognize context of this method
      const { onFileDialogCancel } = options
      const { isFileDialogActive } = this.state
      // execute the timeout only if the onFileDialogCancel is defined and FileDialog
      // is opened in the browser
      if (onFileDialogCancel && isFileDialogActive) {
        setTimeout(() => {
          // Returns an object as FileList
          if (!this.fileInputEl.files.length) {
            this.setState({
              isFileDialogActive: false
            })
            onFileDialogCancel()
          }
        }, 300)
      }
    }

    open = () => {
      this.setState({
        isFileDialogActive: true
      })
      this.fileInputEl.value = null
      this.fileInputEl.click()
    }

    buildHandlers = () =>
      options.disabled
        ? {}
        : {
            onClick: this.onClick,
            onDragStart: this.onDragStart,
            onDragEnter: this.onDragEnter,
            onDragOver: this.onDragOver,
            onDragLeave: this.onDragLeave,
            onDrop: this.onDrop
          }

    buildProps = multiple => {
      const { activeFiles, acceptedFiles, draggedFiles, rejectedFiles, isDragActive } = this.state

      const filesCount = draggedFiles.length
      const isDragAccept = filesCount > 0 && allFilesAccepted(draggedFiles, options.accept)
      const isDragReject = filesCount > 0 && (!isDragAccept || !(multiple || filesCount <= 1))

      return {
        activeFiles,
        acceptedFiles,
        rejectedFiles,
        isDragActive,
        isDragAccept,
        isDragReject
      }
    }

    render() {
      const { accept, disabled, multiple, name, inputProps } = options

      return (
        <div
          {...this.buildHandlers()}
          ref={node => {
            this.node = node
          }}
          aria-disabled={disabled}
        >
          <input
            type="file"
            name={name}
            multiple={supportMultiple && multiple}
            onChange={this.onDrop}
            autoComplete="off"
            style={{ display: 'none' }}
            accept={accept}
            disabled={disabled}
            ref={node => {
              this.fileInputEl = node
            }}
            {...inputProps}
          />

          <WrappedComponent {...this.buildProps(multiple)} />
        </div>
      )
    }
  }

export default makeDropzone
