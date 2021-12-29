import {Webpack, DiscordModules} from "@Holy";

const {Button, Tooltips: {Tooltip}} = DiscordModules;
const Reply = Webpack.findByDisplayName("Reply");

export default function VoiceChannelButton({onClick, className}) {
    return (
        <Tooltip text="Select as Voice Chat">
            {props => (
                <Button
                    {...props}
                    onClick={onClick}
                    className={["vcbtn-container", className].join(" ")}
                    size={Button.Sizes.NONE}
                    look={Button.Looks.BLANK}
                >
                    <Reply width="16" height="16" />
                </Button>
            )}
        </Tooltip>
    );
}