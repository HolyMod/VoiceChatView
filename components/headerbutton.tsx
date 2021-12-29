import {DiscordModules} from "@Holy";
import Compress from "../icons/compress";

const {Tooltips: {Tooltip}, Button} = DiscordModules;

export default function HeaderButton({onClick}) {
    return (
        <Tooltip text="Hide Channels Sidbar" position="bottom">
            {props => (
                <Button
                    {...props}
                    look={Button.Looks.BLANK}
                    size={Button.Sizes.NONE}
                    className="vcbtn-header-button"
                    onClick={onClick}
                >
                    <Compress fill="#ddd" />
                </Button>
            )}
        </Tooltip>
    );
}