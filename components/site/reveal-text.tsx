import { Fragment } from "react";

/**
 * Heading that reveals word by word: each word rises out of its own mask (see .rt-word in globals.css).
 * Screen readers get the full text via aria-label; "\n" in `text` forces a line break.
 * Don't use for text that contains links or other interactive markup.
 */
export function RevealText({
  as: Tag = "h2",
  text,
  className,
  delay,
  id,
}: {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  text: string;
  className?: string;
  delay?: number; // ms before the first word
  id?: string;
}) {
  let wi = 0;
  const lines = text.split("\n");
  return (
    <Tag id={id} className={className} aria-label={text.replace(/\n/g, " ")} data-reveal="text" style={delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(" ").map((word, i, words) => (
            <Fragment key={i}>
              <span className="rt-word" aria-hidden>
                <span className="rt-inner" style={{ "--wi": wi++ } as React.CSSProperties}>{word}</span>
              </span>
              {i < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  );
}
