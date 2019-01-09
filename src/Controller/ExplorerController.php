<?php
/**
 * Created by PhpStorm.
 * User: huqin
 * Date: 2019/1/9
 * Time: 8:37
 */
namespace App\Controller;

use AlibabaCloud\Client\AlibabaCloud;
use AlibabaCloud\Client\DefaultAcsClient;
use AlibabaCloud\Client\Profile\DefaultProfile;
use AlibabaCloud\Sts\V20150401\AssumeRole;
use League\CLImate\TerminalObject\Basic\Json;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;

class ExplorerController extends AbstractController
{
    /**
     * @Route("/", methods="GET")
     */
    public function index() {
        return $this->render("base.html.twig");
    }

    /**
     * @Route("/token", methods="GET")
     */
    public function token() {
        $profile = DefaultProfile::getProfile($_ENV["REGION"],$_ENV["KEY_ID"],$_ENV["KEY_SECRET"]);
        $client = new DefaultAcsClient($profile);
        $request = (new AssumeRole())
            ->withDurationSeconds($_ENV["DURATION"])
            ->withRoleArn($_ENV["ROLE"])
            ->withRoleSessionName("api");
        try {
            $response = $client->getAcsResponse($request);
            return new JsonResponse([
                "code" => 200,
                "data" => $response->toArray()["Credentials"]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                "code" => 500,
                "data" => $e->getMessage()
            ]);
        }
    }

    /**
     * @Route("/shortcuts", methods="GET")
     */
    public function shortcuts() {
        $shortcutsFile = __DIR__.'/../../config/shortcuts.json';
        return new JsonResponse([
            "code" => 200,
            "data" => json_decode(file_get_contents($shortcutsFile), true)
        ]);
    }

    /**
     * @Route("/header", methods="GET")
     */
    public function header() {
        $headerFile = __DIR__.'/../../config/header.md';
        return new JsonResponse([
            "code" => 200,
            "data" => file_get_contents($headerFile)
        ]);
    }
}