/* Dump libzvbi's view of a teletext page as JSON, for the web viewer's conformance test
 * (src/components/teletext/teletext.test.ts): per cell the Unicode character, foreground
 * and background colour (0xRRGGBB), opacity, size and whether it is a DRCS character.
 *
 *   cc -O2 -o t42cells scripts/teletext-t42cells.c -lzvbi    (apt install libzvbi-dev)
 *   nc <ttxd> 4242 > dump.t42      # ttxd's T42 debug stream, a few seconds
 *   t42cells dump.t42 100 2.5 > cells.json */
#include <libzvbi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static void on_page(vbi_event *ev, void *user) { (void) ev; (void) user; }
int main(int argc, char **argv)
{
	FILE *f = fopen(argv[1], "rb");
	int pgno = (int) strtol(argv[2], NULL, 16);
	vbi_wst_level level = !strcmp(argv[3], "1") ? VBI_WST_LEVEL_1
		: !strcmp(argv[3], "1.5") ? VBI_WST_LEVEL_1p5 : VBI_WST_LEVEL_2p5;
	vbi_decoder *vbi = vbi_decoder_new();
	vbi_event_handler_register(vbi, VBI_EVENT_TTX_PAGE, on_page, NULL);
	size_t cap = 1024, n = 0;
	vbi_sliced *s = malloc(cap * sizeof *s);
	unsigned char pk[42];
	while (fread(pk, 1, 42, f) == 42) {
		if (n == cap) s = realloc(s, (cap *= 2) * sizeof *s);
		s[n].id = VBI_SLICED_TELETEXT_B; s[n].line = 7 + n % 5;
		memcpy(s[n].data, pk, 42); n++;
	}
	vbi_decode(vbi, s, (int) n, 1.0);
	vbi_page pg;
	if (!vbi_fetch_vt_page(vbi, &pg, pgno, VBI_ANY_SUBNO, level, 25, TRUE)) return 1;
	printf("[");
	for (int r = 0; r < pg.rows; r++) {
		printf("%s[", r ? ",\n" : "");
		for (int c = 0; c < pg.columns; c++) {
			vbi_char *ch = &pg.text[r * pg.columns + c];
			unsigned fg = pg.color_map[ch->foreground], bg = pg.color_map[ch->background];
			printf("%s{\"u\":%u,\"fg\":%u,\"bg\":%u,\"op\":%d,\"size\":%d,\"drcs\":%d}", c ? "," : "",
			       ch->unicode, ((fg & 255) << 16) | (fg & 0xff00) | ((fg >> 16) & 255),
			       ((bg & 255) << 16) | (bg & 0xff00) | ((bg >> 16) & 255), ch->opacity, ch->size,
			       vbi_is_drcs(ch->unicode));
		}
		printf("]");
	}
	printf("]\n");
	return 0;
}
