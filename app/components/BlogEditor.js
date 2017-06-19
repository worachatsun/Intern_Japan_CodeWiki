import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { Row, Col, Button, Input } from 'antd'
import { 
    CompositeDecorator, 
    convertToRaw, 
    Editor, 
    EditorState, 
    RichUtils, 
    ContentState,
    convertFromRaw
} from 'draft-js'
import Immutable from 'immutable'
import { 
    FaBold, 
    FaItalic, 
    FaUnderline, 
    FaCode, 
    FaStrikethrough,
    FaListOl,
    FaListUl
} from 'react-icons/lib/fa'
import '../assets/editor.css'
import {stateToHTML} from 'draft-js-export-html'

class BlogEditor extends Component {
    constructor(props) {
        super(props)

        const decorator = new CompositeDecorator([
            {
                strategy: this.findDescriptionEntities,
                component: this.Description.bind(this),
            },
        ])

        this.state = {
            editorState: EditorState.createWithContent(convertFromRaw(this.props.editor.editorState), decorator),
            decorator,
            showDesInput: false,
            desValue: '',
            description: ''
        }

        this.props.storeDecorator(decorator)

        this.focus = () => this.refs.editor.focus()
        
        this.onChange = (editorState) => {
            this.setState({editorState})
            
            this.props.storeEditorState(convertToRaw(editorState.getCurrentContent()))

        }

        this.promptForDescription = this._promptForDescription.bind(this)
        this.onDesChange = (e) => this.setState({desValue: e.target.value})
        this.confirmDescription = this._confirmDescription.bind(this)
        this.onDescriptionInputKeyDown = this._onDescriptionInputKeyDown.bind(this)
        this.removeDescription = this._removeDescription.bind(this)

    }

    _promptForDescription(e) {
        e.preventDefault()
        const {editorState} = this.state
        const selection = editorState.getSelection()
        if (!selection.isCollapsed()) {
            const contentState = editorState.getCurrentContent()
            const startKey = editorState.getSelection().getStartKey()
            const startOffset = editorState.getSelection().getStartOffset()
            const blockWithDescriptionAtBeginning = contentState.getBlockForKey(startKey)
            const descriptionKey = blockWithDescriptionAtBeginning.getEntityAt(startOffset)
            let description = ''
            if (descriptionKey) {
                const descriptionInstance = contentState.getEntity(descriptionKey)
                description = descriptionInstance.getData().description
            }
            this.setState({
                showDesInput: true,
                desValue: description,
            }, () => {
                setTimeout(() => this.refs.description.focus(), 0)
            })
        }
    }

    _confirmDescription(e) {
        e.preventDefault()
        const {editorState, desValue} = this.state
        const contentState = editorState.getCurrentContent()
        const contentStateWithEntity = contentState.createEntity(
            'DESCRIPTION',
            'MUTABLE',
            {description: desValue}
        )
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity })
        this.setState({
            editorState: RichUtils.toggleLink(
                newEditorState,
                newEditorState.getSelection(),
                entityKey
            ),
            showDesInput: false,
            desValue: '',
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0)
        })
    }

    _onDescriptionInputKeyDown(e) {
        if (e.which === 13) {
            this._confirmDescription(e)
        }
    }
    
    _removeDescription(e) {
        e.preventDefault()
        const {editorState} = this.state
        const selection = editorState.getSelection()
        if (!selection.isCollapsed()) {
            this.setState({
                editorState: RichUtils.toggleLink(editorState, selection, null),
            })
        }
    }

    _onClickInlineStyle = event =>  this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, event))

    _onClickBlogType = event => this.onChange(RichUtils.toggleBlockType(this.state.editorState, event))

    findDescriptionEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges(
            (character) => {
                const entityKey = character.getEntity() 
                return (
                    entityKey !== null &&
                    contentState.getEntity(entityKey).getType() === 'DESCRIPTION'
                ) 
            },
            callback
        ) 
    }

    Description(props) {
        const {description} = props.contentState.getEntity(props.entityKey).getData() 
        return (
            <code className={'description'} onMouseOver={() => this.props.changeDescription(description)}>
                {props.children}
            </code>
        ) 
    }

    render() {
        let editorStateFromRedux = EditorState.createWithContent(convertFromRaw(this.props.editor.editorState), this.state.decorator)
        let desInput
        if (this.state.showDesInput) {
            desInput =
                <div className={'desInputContainer'}>
                    <Row>
                        <Col span={20}>
                            <Input
                                onChange={this.onDesChange}
                                ref={"description"}
                                className={'desInput'}
                                type={"textarea"}
                                placeholder={'Please enter your description'}
                                value={this.state.desValue}
                                onKeyDown={this.onDescriptionInputKeyDown}
                            />
                        </Col>
                        <Col span={4}>
                            <Button onMouseDown={this.confirmDescription}>
                                Confirm
                            </Button>
                        </Col>
                    </Row>
                </div>
        }
    
        return (
            <div className={'root'}>
                <div style={{marginBottom: 10}}>
                    Select some text, then use the buttons to add or remove description
                    on the selected text.
                </div>
                <div className={'buttons'}>
                    <Button.Group style={{marginRight: 10}}>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.h1)}>h1</Button>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.h2)}>h2</Button>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.h3)}>h3</Button>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.default)}>default</Button>
                    </Button.Group>

                    <Button.Group style={{marginRight: 10}}>
                        <Button onClick={() => this._onClickInlineStyle(changeInlineElement.bold)}><FaBold size={12} /></Button>
                        <Button onClick={() => this._onClickInlineStyle(changeInlineElement.italic)}><FaItalic size={11} /></Button>
                        <Button onClick={() => this._onClickInlineStyle(changeInlineElement.underline)}><FaUnderline size={12} /></Button>
                        <Button onClick={() => this._onClickInlineStyle(changeInlineElement.code)}><FaCode size={15} /></Button>
                        <Button onClick={() => this._onClickInlineStyle(changeInlineElement.strikethrough)}><FaStrikethrough size={12} /></Button>
                    </Button.Group>

                    <Button.Group style={{marginRight: 10}}>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.ol)}><FaListOl size={12} /></Button>
                        <Button onClick={() => this._onClickBlogType(changeBlogTypeElement.ul)}><FaListUl size={12} /></Button>
                    </Button.Group>

                    <Button.Group style={{marginRight: 10}}>
                        <Button onMouseDown={this.promptForDescription}>
                            Add Description
                        </Button>
                        <Button onMouseDown={this.removeDescription}>
                            Remove Description
                        </Button>
                    </Button.Group>

                    <Button icon={'info'}/>
                </div>
                {desInput}
                <Row gutter={8}>
                    <Col span={12}>
                        <div className={'editor'} onClick={this.focus}>
                            <Editor
                                editorState={this.state.editorState}
                                onChange={this.onChange}
                                placeholder={"Enter some text..."}
                                ref={"editor"}
                            />
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={'editor'}>
                            <Editor
                                editorState={editorStateFromRedux}
                                readOnly
                            />
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }

}

const changeInlineElement = {
    bold: 'BOLD',
    italic: 'ITALIC',
    code: 'CODE',
    underline: 'UNDERLINE',
    strikethrough: 'STRIKETHROUGH'
}

const changeBlogTypeElement = {
    h1: 'header-one',
    h2: 'header-two',
    h3: 'header-three',
    blockquote: 'blockquote',
    codeBlock: 'code-block',
    ul: 'unordered-list-item',
    ol: 'ordered-list-item',
    default: 'unstyled'
}

const mapStateToProps = state => {
    return { editor: state.editor }
}

export default connect(mapStateToProps, actions)(BlogEditor)